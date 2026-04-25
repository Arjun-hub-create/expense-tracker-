import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, CATEGORY_META, PAYMENT_ICONS } from '../utils/theme';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrencyFull, formatDateFull } from '../utils/helpers';

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expense } = route.params;
  const { deleteExpense } = useExpenses();
  const meta = CATEGORY_META[expense.category] || CATEGORY_META['Other'];

  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDelete = () => {
    Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const result = await deleteExpense(expense._id);
          if (result.success) navigation.goBack();
          else Alert.alert('Error', result.message);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.bgGlow, { backgroundColor: meta.color + '10' }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Expense Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        <Animated.View style={[styles.heroCard, {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          borderColor: meta.color + '40',
        }]}>
          <View style={[styles.bigIcon, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.bigEmoji}>{meta.icon}</Text>
          </View>
          <Text style={styles.heroCategory}>{expense.category}</Text>
          <Text style={styles.heroAmount}>{formatCurrencyFull(expense.amount)}</Text>
          <Text style={styles.heroDate}>{formatDateFull(expense.date)}</Text>
        </Animated.View>

        {/* Details card */}
        <Animated.View style={[styles.detailCard, { opacity: opacityAnim }]}>
          <DetailRow icon="💳" label="Payment Method" value={`${PAYMENT_ICONS[expense.paymentMethod] || ''} ${expense.paymentMethod}`} />
          {expense.note ? <DetailRow icon="📝" label="Note" value={expense.note} /> : null}
          <DetailRow icon="🔄" label="Recurring" value={expense.isRecurring ? 'Yes' : 'No'} />
          {expense.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              <Text style={styles.detailIcon}>🏷️</Text>
              <View>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagsList}>
                  {expense.tags.map(tag => (
                    <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actionsSection, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('AddExpense', { expense })}
            activeOpacity={0.85}
          >
            <Text style={styles.editBtnIcon}>✎</Text>
            <Text style={styles.editBtnText}>Edit Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={styles.deleteBtnIcon}>🗑</Text>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, paddingTop: SPACING.xl },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: COLORS.textPrimary },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  heroCard: {
    marginHorizontal: SPACING.base, marginBottom: SPACING.base,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, padding: SPACING.xxl, alignItems: 'center', ...SHADOWS.gold,
  },
  bigIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bigEmoji: { fontSize: 36 },
  heroCategory: { fontSize: 13, color: COLORS.textMuted, letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  heroAmount: { fontSize: 44, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  heroDate: { fontSize: 13, color: COLORS.textSecondary },
  detailCard: {
    marginHorizontal: SPACING.base, marginBottom: SPACING.base,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.borderCard, padding: SPACING.base, ...SHADOWS.card,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderCard },
  detailIcon: { fontSize: 20, marginRight: SPACING.md, width: 28 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  tagsRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: SPACING.md },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: { backgroundColor: COLORS.bgInput, borderRadius: RADIUS.round, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, color: COLORS.textSecondary },
  actionsSection: { flexDirection: 'row', paddingHorizontal: SPACING.base, gap: SPACING.sm },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.gold, borderRadius: RADIUS.lg, paddingVertical: 15,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  editBtnIcon: { fontSize: 18, color: COLORS.bg },
  editBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.bg },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: RADIUS.lg, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.25)', paddingHorizontal: 20,
  },
  deleteBtnIcon: { fontSize: 16 },
  deleteBtnText: { fontSize: 14, color: COLORS.error, fontWeight: '700' },
});
