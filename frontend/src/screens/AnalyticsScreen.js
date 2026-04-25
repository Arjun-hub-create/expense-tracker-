import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, CATEGORY_META, SHADOWS } from '../utils/theme';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyFull, formatCurrency, MONTHS } from '../utils/helpers';

const { width } = Dimensions.get('window');
const PIE_SIZE = 200;
const PIE_RADIUS = 80;
const PIE_CENTER = PIE_SIZE / 2;

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { summary, fetchSummary } = useExpenses();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef([...Array(12)].map(() => new Animated.Value(0))).current;
  const pieAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [selectedMonth, selectedYear])
  );

  const loadData = async () => {
    await fetchSummary(selectedMonth + 1, selectedYear);
    animateIn();
  };

  const animateIn = () => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(chartAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(pieAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    barAnims.forEach((anim, i) => {
      Animated.sequence([
        Animated.delay(i * 50 + 300),
        Animated.spring(anim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: false }),
      ]).start();
    });
  };

  const monthlyData = summary?.monthlyBreakdown || [];
  const categoryData = summary?.currentMonth?.categoryBreakdown || [];
  const dailyTrend = summary?.dailyTrend || [];
  const monthTotal = summary?.currentMonth?.total || 0;
  const allTime = summary?.allTime || {};
  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1);
  const maxDaily = Math.max(...dailyTrend.map(d => d.total), 1);

  // Build pseudo-donut segments
  const buildDonutSegments = () => {
    if (!categoryData.length) return null;
    const total = categoryData.reduce((s, c) => s + c.total, 0);
    let currentAngle = -90;
    return categoryData.slice(0, 6).map((cat, i) => {
      const pct = cat.total / total;
      const angle = pct * 360;
      const meta = CATEGORY_META[cat._id] || CATEGORY_META['Other'];
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...cat, pct, angle, startAngle, color: meta.color, icon: meta.icon };
    });
  };

  const segments = buildDonutSegments();

  return (
    <View style={styles.container}>
      <View style={styles.bgOrb} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Insights & spending patterns</Text>
        </Animated.View>

        {/* Month selector */}
        <Animated.ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={[styles.monthScroll, { opacity: headerAnim }]}
          contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: SPACING.sm }}
        >
          {MONTHS.map((m, i) => {
            const isSelected = i === selectedMonth;
            const hasFuture = i > now.getMonth() && selectedYear >= now.getFullYear();
            return (
              <TouchableOpacity
                key={m}
                style={[styles.monthChip, isSelected && styles.monthChipActive, hasFuture && { opacity: 0.3 }]}
                onPress={() => !hasFuture && setSelectedMonth(i)}
                disabled={hasFuture}
              >
                <Text style={[styles.monthText, isSelected && styles.monthTextActive]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </Animated.ScrollView>

        {/* Summary stats row */}
        <Animated.View style={[styles.statsRow, { opacity: statsAnim }]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(monthTotal, user?.currency)}</Text>
            <Text style={styles.statLabel}>{MONTHS[selectedMonth]} Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{categoryData.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(monthTotal / Math.max(dailyTrend.length, 1), user?.currency)}</Text>
            <Text style={styles.statLabel}>Daily Avg</Text>
          </View>
        </Animated.View>

        {/* All-time stats */}
        <Animated.View style={[styles.card, styles.allTimeCard, { opacity: statsAnim }]}>
          <View style={styles.allTimeStar}><Text style={styles.starIcon}>◈</Text></View>
          <View style={styles.allTimeContent}>
            <Text style={styles.allTimeLabel}>All-Time Spending</Text>
            <Text style={styles.allTimeValue}>{formatCurrencyFull(allTime.total || 0, user?.currency)}</Text>
            <Text style={styles.allTimeSub}>{allTime.count || 0} total transactions recorded</Text>
          </View>
        </Animated.View>

        {/* Category donut + list */}
        {categoryData.length > 0 && (
          <Animated.View style={[styles.card, { opacity: pieAnim }]}>
            <Text style={styles.cardTitle}>Spending Breakdown</Text>
            <Text style={styles.cardSubtitle}>{MONTHS[selectedMonth]} {selectedYear}</Text>

            {/* Visual donut representation using colored bars */}
            <View style={styles.donutBar}>
              {segments && segments.map((seg, i) => (
                <View key={i} style={[styles.donutSegment, { flex: seg.pct, backgroundColor: seg.color }]} />
              ))}
            </View>

            {/* Category legend */}
            {categoryData.map((cat) => {
              const meta = CATEGORY_META[cat._id] || CATEGORY_META['Other'];
              const pct = monthTotal > 0 ? (cat.total / monthTotal) * 100 : 0;
              return (
                <View key={cat._id} style={styles.catRow}>
                  <View style={[styles.catDot, { backgroundColor: meta.color }]} />
                  <Text style={styles.catIcon}>{meta.icon}</Text>
                  <Text style={styles.catName}>{cat._id}</Text>
                  <View style={styles.catBarTrack}>
                    <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: meta.color }]} />
                  </View>
                  <Text style={styles.catPct}>{pct.toFixed(0)}%</Text>
                  <Text style={styles.catAmt}>{formatCurrency(cat.total, user?.currency)}</Text>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Monthly bar chart */}
        <Animated.View style={[styles.card, { opacity: chartAnim }]}>
          <Text style={styles.cardTitle}>Year Overview</Text>
          <Text style={styles.cardSubtitle}>{selectedYear} monthly breakdown</Text>
          <View style={styles.monthlyChart}>
            {MONTHS.map((mon, i) => {
              const mData = monthlyData.find(m => m._id === i + 1);
              const val = mData?.total || 0;
              const isCurrentMonth = i === now.getMonth();
              const isSelected = i === selectedMonth;
              return (
                <TouchableOpacity key={mon} style={styles.monthBar} onPress={() => setSelectedMonth(i)}>
                  <Animated.View style={[
                    styles.monthBarFill,
                    {
                      height: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: [4, Math.max((val / maxMonthly) * 120, 4)] }),
                      backgroundColor: isSelected ? COLORS.gold : isCurrentMonth ? COLORS.goldDark : COLORS.bgCardElevated,
                    }
                  ]} />
                  <Text style={[styles.monthBarLabel, (isSelected || isCurrentMonth) && { color: COLORS.gold }]}>{mon}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Daily trend (last 30 days) */}
        {dailyTrend.length > 0 && (
          <Animated.View style={[styles.card, { opacity: chartAnim }]}>
            <Text style={styles.cardTitle}>Daily Activity</Text>
            <Text style={styles.cardSubtitle}>Last 30 days spending</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dailyChart}>
                {dailyTrend.slice(-14).map((d, i) => {
                  const h = (d.total / maxDaily) * 80;
                  const date = new Date(d._id);
                  return (
                    <View key={d._id} style={styles.dayBar}>
                      <Text style={styles.dayBarValue}>{formatCurrency(d.total)}</Text>
                      <View style={[styles.dayBarFill, { height: Math.max(h, 4) }]} />
                      <Text style={styles.dayBarLabel}>{date.getDate()}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Empty state */}
        {categoryData.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◈</Text>
            <Text style={styles.emptyTitle}>No data for {MONTHS[selectedMonth]}</Text>
            <Text style={styles.emptyText}>Add expenses to see analytics here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgOrb: {
    position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(124,92,191,0.05)',
  },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.xl, paddingBottom: SPACING.sm },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  monthScroll: { marginBottom: SPACING.sm },
  monthChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: RADIUS.round,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  monthChipActive: { backgroundColor: COLORS.bgCardElevated, borderColor: COLORS.gold },
  monthText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  monthTextActive: { color: COLORS.gold },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.base },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.borderCard, padding: SPACING.md, alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 3, textAlign: 'center' },
  card: {
    marginHorizontal: SPACING.base, marginBottom: SPACING.base,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.borderCard, padding: SPACING.base, ...SHADOWS.card,
  },
  allTimeCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base },
  allTimeStar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.bgCardElevated, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  starIcon: { fontSize: 24, color: COLORS.gold },
  allTimeContent: { flex: 1 },
  allTimeLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 1 },
  allTimeValue: { fontSize: 24, fontWeight: '800', color: COLORS.gold, marginVertical: 2 },
  allTimeSub: { fontSize: 11, color: COLORS.textMuted },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardSubtitle: { fontSize: 11, color: COLORS.textMuted, marginBottom: SPACING.base, marginTop: 3 },
  donutBar: { height: 10, borderRadius: 5, flexDirection: 'row', overflow: 'hidden', marginBottom: SPACING.base },
  donutSegment: { height: '100%' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catIcon: { fontSize: 14 },
  catName: { fontSize: 12, color: COLORS.textSecondary, width: 100 },
  catBarTrack: { flex: 1, height: 4, backgroundColor: COLORS.bgInput, borderRadius: 2, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 2 },
  catPct: { fontSize: 11, color: COLORS.textMuted, width: 30, textAlign: 'right' },
  catAmt: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '700', width: 60, textAlign: 'right' },
  monthlyChart: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 4 },
  monthBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  monthBarFill: { width: '85%', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  monthBarLabel: { fontSize: 8, color: COLORS.textMuted, marginTop: 4 },
  dailyChart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6, paddingHorizontal: 4 },
  dayBar: { alignItems: 'center', justifyContent: 'flex-end', width: 30 },
  dayBarValue: { fontSize: 7, color: COLORS.textMuted, marginBottom: 2 },
  dayBarFill: { width: 20, backgroundColor: COLORS.accent, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  dayBarLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxxl, paddingHorizontal: SPACING.xxl },
  emptyIcon: { fontSize: 36, color: COLORS.gold, opacity: 0.3, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
});
