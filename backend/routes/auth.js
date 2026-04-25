const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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

      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      const token = generateToken(user._id);
      const userWithoutPassword = user.toJSON();

      res.json({
        success: true,
        message: 'Logged in successfully!',
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error during login.' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('monthlyBudget').optional().isNumeric().withMessage('Budget must be a number'),
    body('currency').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.monthlyBudget !== undefined) updates.monthlyBudget = req.body.monthlyBudget;
      if (req.body.currency) updates.currency = req.body.currency;

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({ success: true, message: 'Profile updated!', user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.comparePassword(req.body.currentPassword);

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      user.password = req.body.newPassword;
      await user.save();

      res.json({ success: true, message: 'Password changed successfully!' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);

module.exports = router;
