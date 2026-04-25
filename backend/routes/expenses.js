const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET /api/expenses
// @desc    Get all expenses with filters & pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'desc',
      search,
    } = req.query;

    const filter = { user: req.user._id };

    if (category && category !== 'All') filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (search) {
      filter.$or = [
        { note: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = ['date', 'amount', 'category', 'createdAt'].includes(sortBy) ? sortBy : 'date';

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Expense.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + expenses.length < total,
      },
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching expenses.' });
  }
});

// @route   GET /api/expenses/summary
// @desc    Get expense summary (category-wise, monthly, totals)
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Category-wise breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Daily spending trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const dailyTrend = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly breakdown for the year
    const monthlyBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(targetYear, 0, 1),
            $lte: new Date(targetYear, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Total for current month
    const monthTotal = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);

    // All time total
    const allTimeResult = await Expense.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const allTime = allTimeResult[0] || { total: 0, count: 0 };

    // Top expense this month
    const topExpense = await Expense.findOne({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ amount: -1 });

    res.json({
      success: true,
      data: {
        currentMonth: {
          total: parseFloat(monthTotal.toFixed(2)),
          categoryBreakdown,
          month: targetMonth + 1,
          year: targetYear,
        },
        dailyTrend,
        monthlyBreakdown,
        allTime: {
          total: parseFloat(allTime.total.toFixed(2)),
          count: allTime.count,
        },
        topExpense,
      },
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching summary.' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post(
  '/',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category').isIn(Expense.schema.path('category').enumValues).withMessage('Invalid category'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('note').optional().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
    body('paymentMethod').optional().isIn(['Cash', 'Card', 'UPI', 'Net Banking', 'Other']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
          errors: errors.array(),
        });
      }

      const { amount, category, date, note, paymentMethod, isRecurring, tags } = req.body;

      const expense = await Expense.create({
        user: req.user._id,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        note: note || '',
        paymentMethod: paymentMethod || 'Cash',
        isRecurring: isRecurring || false,
        tags: tags || [],
      });

      res.status(201).json({
        success: true,
        message: 'Expense added successfully!',
        data: expense,
      });
    } catch (error) {
      console.error('Create expense error:', error);
      res.status(500).json({ success: false, message: 'Server error creating expense.' });
    }
  }
);

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('category')
      .optional()
      .isIn(Expense.schema.path('category').enumValues)
      .withMessage('Invalid category'),
    body('date').optional().isISO8601().withMessage('Invalid date'),
    body('note').optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found.' });
      }

      const updates = {};
      if (req.body.amount !== undefined) updates.amount = parseFloat(req.body.amount);
      if (req.body.category) updates.category = req.body.category;
      if (req.body.date) updates.date = new Date(req.body.date);
      if (req.body.note !== undefined) updates.note = req.body.note;
      if (req.body.paymentMethod) updates.paymentMethod = req.body.paymentMethod;
      if (req.body.isRecurring !== undefined) updates.isRecurring = req.body.isRecurring;
      if (req.body.tags) updates.tags = req.body.tags;

      const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        message: 'Expense updated successfully!',
        data: updatedExpense,
      });
    } catch (error) {
      console.error('Update expense error:', error);
      res.status(500).json({ success: false, message: 'Server error updating expense.' });
    }
  }
);

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found.' });
    }
    res.json({ success: true, message: 'Expense deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting expense.' });
  }
});

// @route   DELETE /api/expenses
// @desc    Delete multiple expenses
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No expense IDs provided.' });
    }

    const result = await Expense.deleteMany({ _id: { $in: ids }, user: req.user._id });
    res.json({
      success: true,
      message: `${result.deletedCount} expense(s) deleted successfully!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
