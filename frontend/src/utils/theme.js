// ============================================
// AURUM — Dark Luxury Theme for Expense Tracker
// ============================================

export const COLORS = {
  // Core backgrounds
  bg: '#0A0A0F',
  bgCard: '#12121A',
  bgCardElevated: '#1A1A26',
  bgSurface: '#16162A',
  bgInput: '#1E1E2E',

  // Gold accent system
  gold: '#C9A84C',
  goldLight: '#E4C06E',
  goldDark: '#A07C30',
  goldGlow: 'rgba(201, 168, 76, 0.15)',
  goldMid: 'rgba(201, 168, 76, 0.4)',

  // Accent palette
  accent: '#7C5CBF',
  accentLight: '#A67FF0',
  teal: '#4ECDC4',
  coral: '#FF6B6B',
  mint: '#6BCBA1',
  lavender: '#B39DDB',
  peach: '#FFAB91',

  // Text
  textPrimary: '#F2EFEA',
  textSecondary: '#9E9BB5',
  textMuted: '#5E5C7A',
  textGold: '#C9A84C',

  // Status
  success: '#6BCBA1',
  error: '#FF6B6B',
  warning: '#FFD166',
  info: '#74B9FF',

  // Category colors
  categoryColors: {
    'Food & Dining': '#FF6B6B',
    Transportation: '#4ECDC4',
    Shopping: '#45B7D1',
    Entertainment: '#F8BBD0',
    Healthcare: '#FFD166',
    Housing: '#B39DDB',
    Education: '#80DEEA',
    Travel: '#FFCC80',
    Utilities: '#CE93D8',
    'Personal Care': '#F48FB1',
    Investments: '#A5D6A7',
    Other: '#78909C',
  },

  // Gradients (as arrays for LinearGradient)
  gradientGold: ['#C9A84C', '#A07C30'],
  gradientDark: ['#12121A', '#0A0A0F'],
  gradientCard: ['#1A1A26', '#12121A'],
  gradientPurple: ['#7C5CBF', '#4A3A7A'],
  gradientSuccess: ['#6BCBA1', '#4A9B74'],
  gradientDanger: ['#FF6B6B', '#C94444'],

  // Borders
  border: 'rgba(201, 168, 76, 0.15)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderCard: 'rgba(255, 255, 255, 0.04)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.85)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Tab bar
  tabActive: '#C9A84C',
  tabInactive: '#5E5C7A',
  tabBg: '#0E0E16',
};

export const FONTS = {
  // Display - Playfair Display style (use system serif or custom)
  displayBold: 'serif',       // Replace with actual font name after install
  displayMedium: 'serif',

  // Body
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  light: 'System',

  // Sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
    hero: 48,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const SHADOWS = {
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
};

export const CATEGORY_META = {
  'Food & Dining': { icon: '🍽️', color: '#FF6B6B' },
  Transportation: { icon: '🚗', color: '#4ECDC4' },
  Shopping: { icon: '🛍️', color: '#45B7D1' },
  Entertainment: { icon: '🎬', color: '#F8BBD0' },
  Healthcare: { icon: '💊', color: '#FFD166' },
  Housing: { icon: '🏠', color: '#B39DDB' },
  Education: { icon: '📚', color: '#80DEEA' },
  Travel: { icon: '✈️', color: '#FFCC80' },
  Utilities: { icon: '⚡', color: '#CE93D8' },
  'Personal Care': { icon: '💆', color: '#F48FB1' },
  Investments: { icon: '📈', color: '#A5D6A7' },
  Other: { icon: '📦', color: '#78909C' },
};

export const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'];
export const PAYMENT_ICONS = {
  Cash: '💵',
  Card: '💳',
  UPI: '📱',
  'Net Banking': '🏦',
  Other: '🔄',
};
