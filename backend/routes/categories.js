const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

router.use(auth);

// @route   GET /api/categories
// @desc    Get all available categories with icons
// @access  Private
router.get('/', async (req, res) => {
  const categories = Expense.schema.path('category').enumValues;

  const categoryMeta = {
    'Food & Dining': { icon: '🍽️', color: '#FF6B6B' },
    Transportation: { icon: '🚗', color: '#4ECDC4' },
    Shopping: { icon: '🛍️', color: '#45B7D1' },
    Entertainment: { icon: '🎬', color: '#96CEB4' },
    Healthcare: { icon: '💊', color: '#FFEAA7' },
    Housing: { icon: '🏠', color: '#DDA0DD' },
    Education: { icon: '📚', color: '#98D8C8' },
    Travel: { icon: '✈️', color: '#F7DC6F' },
    Utilities: { icon: '⚡', color: '#BB8FCE' },
    'Personal Care': { icon: '💆', color: '#F1948A' },
    Investments: { icon: '📈', color: '#82E0AA' },
    Other: { icon: '📦', color: '#AEB6BF' },
  };

  const result = categories.map((cat) => ({
    name: cat,
    ...(categoryMeta[cat] || { icon: '📦', color: '#AEB6BF' }),
  }));

  res.json({ success: true, data: result });
});

module.exports = router;
