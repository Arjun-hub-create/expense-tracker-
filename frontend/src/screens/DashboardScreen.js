import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, TouchableOpacity,
  Dimensions, RefreshControl, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOWS, CATEGORY_META } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrencyFull, formatCurrency, formatDateShort, getInitials, MONTHS } from '../utils/helpers';

const { width } = Dimensions.get('window');
const BAR_WIDTH = (width - SPACING.base * 2 - SPACING.sm * 11) / 12;

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { summary, isLoading, fetchSummary, fetchExpenses } = useExpenses();
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();

  // Animations
  const headerAnim = useRef(new Animated.Value(-80)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const cardSlides = useRef([...Array(6)].map(() => new Animated.Value(30))).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    // Floating animation for hero card
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchSummary(now.getMonth() + 1, now.getFullYear()),
      fetchExpenses({ limit: 5 }),
    ]);
    animateEntrance();
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(i * 80),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(cardSlides[i], { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const monthTotal = summary?.currentMonth?.total || 0;
  const budget = user?.monthlyBudget || 0;
  const budgetPercent = budget > 0 ? Math.min((monthTotal / budget) * 100, 100) : 0;
  const categoryBreakdown = summary?.currentMonth?.categoryBreakdown || [];
  const monthlyBreakdown = summary?.monthlyBreakdown || [];
  const maxMonthly = Math.max(...monthlyBreakdown.map(m => m.total), 1);

  const headerTranslate = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, -20], extrapolate: 'clamp' });
  const headerScale = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0.96], extrapolate: 'clamp' });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Background decorations */}
      <View style={styles.bgDecor1} />
      <View style={styles.bgDecor2} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: headerAnim }, { translateY: headerTranslate }, { scale: headerScale }], opacity: headerOpacity }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</Text>
            <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Hero balance card */}
        <Animated.View style={[styles.heroCard, { opacity: cardAnims[0], transform: [{ translateY: cardSlides[0] }, { translateY: floatAnim }] }]}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroLabel}>{MONTHS[now.getMonth()]} {now.getFullYear()} Spending</Text>
          <Text style={styles.heroAmount}>{formatCurrencyFull(monthTotal, user?.currency)}</Text>
          {budget > 0 && (
            <View style={styles.budgetSection}>
              <View style={styles.budgetTextRow}>
                <Text style={styles.budgetLabel}>Budget Used</Text>
                <Text style={[styles.budgetPct, { color: budgetPercent > 90 ? COLORS.error : budgetPercent > 70 ? COLORS.warning : COLORS.gold }]}>
                  {budgetPercent.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, {
                  width: `${budgetPercent}%`,
                  backgroundColor: budgetPercent > 90 ? COLORS.error : budgetPercent > 70 ? COLORS.warning : COLORS.gold,
                }]} />
              </View>
              <Text style={styles.budgetRemaining}>
                {formatCurrency(Math.max(budget - monthTotal, 0), user?.currency)} remaining of {formatCurrencyFull(budget, user?.currency)}
              </Text>
            </View>
          )}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{summary?.currentMonth?.categoryBreakdown?.length || 0}</Text>
              <Text style={styles.heroStatLabel}>Categories</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{summary?.allTime?.count || 0}</Text>
              <Text style={styles.heroStatLabel}>All Time</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{formatCurrency(summary?.allTime?.total || 0, user?.currency)}</Text>
              <Text style={styles.heroStatLabel}>Total Spent</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View style={[styles.section, { opacity: cardAnims[1], transform: [{ translateY: cardSlides[1] }] }]}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickBtn, styles.quickBtnPrimary]} onPress={() => navigation.navigate('AddExpense', {})}>
              <Text style={styles.quickBtnIcon}>+</Text>
              <Text style={styles.quickBtnTextPrimary}>Add Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.quickBtnIconSecondary}>≡</Text>
              <Text style={styles.quickBtnText}>All Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate('Analytics')}>
              <Text style={styles.quickBtnIconSecondary}>◐</Text>
              <Text style={styles.quickBtnText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Monthly bar chart */}
        {monthlyBreakdown.length > 0 && (
          <Animated.View style={[styles.card, { opacity: cardAnims[2], transform: [{ translateY: cardSlides[2] }] }]}>
            <Text style={styles.cardTitle}>Monthly Trend</Text>
            <Text style={styles.cardSubtitle}>{now.getFullYear()}</Text>
            <View style={styles.barChart}>
              {MONTHS.map((mon, i) => {
                const monthData = monthlyBreakdown.find(m => m._id === i + 1);
                const val = monthData?.total || 0;
                const barH = maxMonthly > 0 ? (val / maxMonthly) * 80 : 2;
                const isCurrent = i === now.getMonth();
                return (
                  <View key={mon} style={styles.barGroup}>
                    <Text style={[styles.barValue, { opacity: val > 0 ? 1 : 0 }]}>{val > 0 ? formatCurrency(val) : ''}</Text>
                    <View style={[styles.bar, { height: Math.max(barH, 3), backgroundColor: isCurrent ? COLORS.gold : COLORS.bgCardElevated, borderTopLeftRadius: 3, borderTopRightRadius: 3 }]} />
                    <Text style={[styles.barLabel, isCurrent && { color: COLORS.gold }]}>{mon}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Top categories */}
        {categoryBreakdown.length > 0 && (
          <Animated.View style={[styles.card, { opacity: cardAnims[3], transform: [{ translateY: cardSlides[3] }] }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Top Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Analytics')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {categoryBreakdown.slice(0, 5).map((cat, i) => {
              const meta = CATEGORY_META[cat._id] || CATEGORY_META['Other'];
              const pct = monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0;
              return (
                <View key={cat._id} style={styles.categoryRow}>
                  <View style={[styles.categoryIcon, { backgroundColor: meta.color + '20' }]}>
                    <Text style={styles.categoryEmoji}>{meta.icon}</Text>
                  </View>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryTopRow}>
                      <Text style={styles.categoryName}>{cat._id}</Text>
                      <Text style={styles.categoryAmount}>{formatCurrencyFull(cat.total, user?.currency)}</Text>
                    </View>
                    <View style={styles.categoryTrack}>
                      <View style={[styles.categoryFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={styles.categoryPct}>{pct.toFixed(1)}% · {cat.count} transactions</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Recent expenses */}
        <Animated.View style={[styles.card, { opacity: cardAnims[4], transform: [{ translateY: cardSlides[4] }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {(summary?.dailyTrend?.length === 0 && !isLoading) ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>◈</Text>
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptyText}>Start tracking your spending to see insights here.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddExpense', {})}>
                <Text style={styles.emptyBtnText}>Add First Expense</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.dailyNote}>
              {summary?.dailyTrend?.length > 0
                ? `${summary.dailyTrend.length} active days this month`
                : 'Loading your activity...'}
            </Text>
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgDecor1: {
    position: 'absolute', top: -100, right: -100,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  bgDecor2: {
    position: 'absolute', top: 200, left: -150,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(124,92,191,0.04)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, paddingTop: SPACING.xl, paddingBottom: SPACING.base },
  headerLeft: {},
  greeting: { fontSize: 13, color: COLORS.textSecondary, letterSpacing: 0.5 },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  avatarBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.bgCard, borderWidth: 1.5, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: COLORS.gold },
  heroCard: {
    marginHorizontal: SPACING.base, marginVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl,
    overflow: 'hidden', ...SHADOWS.gold,
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(201,168,76,0.07)',
  },
  heroLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  heroAmount: { fontSize: 38, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.base },
  budgetSection: { marginBottom: SPACING.base },
  budgetTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel: { fontSize: 12, color: COLORS.textSecondary },
  budgetPct: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: COLORS.bgInput, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  budgetRemaining: { fontSize: 11, color: COLORS.textMuted, marginTop: 5 },
  heroStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.base, marginTop: SPACING.sm },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, backgroundColor: COLORS.borderLight },
  heroStatValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  heroStatLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 3, letterSpacing: 0.5 },
  section: { paddingHorizontal: SPACING.base, marginBottom: SPACING.sm },
  quickActions: { flexDirection: 'row', gap: SPACING.sm },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    alignItems: 'center', paddingVertical: 14,
  },
  quickBtnPrimary: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  quickBtnIcon: { fontSize: 20, color: COLORS.bg, fontWeight: '800' },
  quickBtnIconSecondary: { fontSize: 18, color: COLORS.gold },
  quickBtnTextPrimary: { fontSize: 11, color: COLORS.bg, fontWeight: '700', marginTop: 3 },
  quickBtnText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  card: {
    marginHorizontal: SPACING.base, marginBottom: SPACING.base,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.borderCard, padding: SPACING.base, ...SHADOWS.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.base },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.base },
  seeAll: { fontSize: 12, color: COLORS.gold, fontWeight: '600' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '80%' },
  barLabel: { fontSize: 8, color: COLORS.textMuted, marginTop: 4 },
  barValue: { fontSize: 7, color: COLORS.textMuted, marginBottom: 2 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.base },
  categoryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  categoryEmoji: { fontSize: 18 },
  categoryInfo: { flex: 1 },
  categoryTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  categoryName: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  categoryAmount: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '700' },
  categoryTrack: { height: 3, backgroundColor: COLORS.bgInput, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  categoryFill: { height: '100%', borderRadius: 2 },
  categoryPct: { fontSize: 11, color: COLORS.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyEmoji: { fontSize: 32, color: COLORS.gold, opacity: 0.4, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.base },
  emptyBtn: { backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border },
  emptyBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 13 },
  dailyNote: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.base },
});
