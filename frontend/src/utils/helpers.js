import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};

export const formatCurrencyFull = (amount, currency = 'INR') => {
  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
};

export const formatDateShort = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(d, 'dd MMM');
};

export const formatDateFull = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(d, 'EEEE, dd MMMM yyyy');
};

export const formatDateForAPI = (date) => format(new Date(date), 'yyyy-MM-dd');

export const getMonthName = (month) => {
  return format(new Date(2024, month - 1, 1), 'MMMM');
};

export const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    startDate: formatDateForAPI(startOfMonth(now)),
    endDate: formatDateForAPI(endOfMonth(now)),
  };
};

export const groupExpensesByDate = (expenses) => {
  const groups = {};
  expenses.forEach((exp) => {
    const key = formatDate(exp.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(exp);
  });
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
};

export const validateExpenseForm = ({ amount, category, date }) => {
  const errors = {};
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    errors.amount = 'Enter a valid amount greater than 0';
  }
  if (!category) errors.category = 'Please select a category';
  if (!date) errors.date = 'Please select a date';
  return errors;
};

export const validateAuthForm = ({ email, password, name, isRegister }) => {
  const errors = {};
  if (isRegister && (!name || name.trim().length < 2)) {
    errors.name = 'Name must be at least 2 characters';
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
};

export const getCategoryPercentage = (categoryTotal, monthTotal) => {
  if (!monthTotal) return 0;
  return Math.round((categoryTotal / monthTotal) * 100);
};

export const getInitials = (name = '') => {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
