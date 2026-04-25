import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../utils/theme';

// ─── AnimatedCard ─────────────────────────────────────────────────────────────
export function AnimatedCard({ children, style, delay = 0, onPress }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 80,
        friction: 10,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        { opacity, transform: [{ translateY }, { scale }] },
        style,
      ]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── GoldButton ───────────────────────────────────────────────────────────────
export function GoldButton({ title, onPress, loading, disabled, style, textStyle, variant = 'gold' }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const bgColor = variant === 'ghost'
    ? 'transparent'
    : variant === 'danger'
    ? COLORS.error
    : COLORS.gold;

  const borderColor = variant === 'ghost' ? COLORS.border : 'transparent';
  const titleColor = variant === 'ghost' ? COLORS.textSecondary : COLORS.bg;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          { backgroundColor: bgColor, borderWidth: variant === 'ghost' ? 1 : 0, borderColor },
          (disabled || loading) && styles.buttonDisabled,
          style,
        ]}>
        {loading ? (
          <ActivityIndicator color={titleColor} size="small" />
        ) : (
          <Text style={[styles.buttonText, { color: titleColor }, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── InputField ───────────────────────────────────────────────────────────────
export function InputField({ label, error, style, inputStyle, prefix, suffix, ...props }) {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.gold],
  });

  return (
    <View style={[styles.inputWrap, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => { onFocus(); props.onFocus?.(); }}
          onBlur={() => { onBlur(); props.onBlur?.(); }}
          {...props}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </Animated.View>
      {error && <Text style={styles.inputError}>{error}</Text>}
    </View>
  );
}

// ─── CategoryBadge ────────────────────────────────────────────────────────────
export function CategoryBadge({ category, color, icon, size = 'md' }) {
  const small = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }, small && styles.badgeSm]}>
      {icon && <Text style={small ? styles.badgeIconSm : styles.badgeIcon}>{icon}</Text>}
      <Text style={[styles.badgeText, { color }, small && styles.badgeTextSm]}>{category}</Text>
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, subtitle, action, actionLabel }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.empty, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && actionLabel && (
        <GoldButton title={actionLabel} onPress={action} style={styles.emptyAction} />
      )}
    </Animated.View>
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────
export function SkeletonCard() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View style={[styles.skeleton, { opacity }]}>
      <View style={styles.skeletonLeft}>
        <View style={styles.skeletonCircle} />
      </View>
      <View style={styles.skeletonRight}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
      </View>
      <View style={styles.skeletonAmount} />
    </Animated.View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    ...SHADOWS.card,
    marginBottom: SPACING.md,
  },
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: { opacity: 0.5 },
  inputWrap: { marginBottom: SPACING.base },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.base,
    height: 52,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
  },
  inputPrefix: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    marginRight: 8,
  },
  inputSuffix: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    marginLeft: 8,
  },
  inputError: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.round,
    gap: 4,
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeIcon: { fontSize: 14 },
  badgeIconSm: { fontSize: 11 },
  badgeText: { fontSize: FONTS.sizes.sm, fontWeight: '600' },
  badgeTextSm: { fontSize: FONTS.sizes.xs },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: { fontSize: 60, marginBottom: SPACING.base },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  emptyAction: { marginTop: SPACING.sm, paddingHorizontal: SPACING.xxl },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  skeletonLeft: { marginRight: SPACING.md },
  skeletonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgCardElevated,
  },
  skeletonRight: { flex: 1 },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.bgCardElevated,
  },
  skeletonAmount: {
    width: 70,
    height: 20,
    borderRadius: 6,
    backgroundColor: COLORS.bgCardElevated,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.base,
  },
});
