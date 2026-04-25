const mongoose = require('mongoose');

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Housing',
  'Education',
  'Travel',
  'Utilities',
  'Personal Care',
  'Investments',
  'Other',
];

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      get: (v) => parseFloat(v.toFixed(2)),
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'],
      default: 'Cash',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Compound index for efficient queries
expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

expenseSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Expense', expenseSchema);
