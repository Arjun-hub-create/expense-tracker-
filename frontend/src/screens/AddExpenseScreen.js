import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS, CATEGORY_META, PAYMENT_METHODS, PAYMENT_ICONS } from '../utils/theme';
import { useExpenses } from '../context/ExpenseContext';
import { validateExpenseForm, formatDateForAPI } from '../utils/helpers';

const CATEGORIES = Object.keys(CATEGORY_META);

export default function AddExpenseScreen({ navigation, route }) {
  const editExpense = route?.params?.expense;
  const isEdit = !!editExpense;

  const { addExpense, updateExpense } = useExpenses();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successAnim] = useState(new Animated.Value(0));

  const [form, setForm] = useState({
    amount: editExpense?.amount?.toString() || '',
    category: editExpense?.category || '',
    date: editExpense ? new Date(editExpense.date) : new Date(),
    note: editExpense?.note || '',
    paymentMethod: editExpense?.paymentMethod || 'Cash',
    isRecurring: editExpense?.isRecurring || false,
  });

  // Animations
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const amountScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setForm(prev => ({ ...prev, amount: cleaned }));
    if (errors.amount) setErrors(prev => ({ ...prev, amount: null }));

    if (cleaned) {
      Animated.sequence([
        Animated.timing(amountScale, { toValue: 1.04, duration: 80, useNativeDriver: true }),
        Animated.timing(amountScale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  };

  const shakeForm = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleDateChange = (direction) => {
    const d = new Date(form.date);
    d.setDate(d.getDate() + direction);
    setForm(prev => ({ ...prev, date: d }));
  };

  const handleSubmit = async () => {
    const validationErrors = validateExpenseForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      shakeForm();
      return;
    }

    setIsLoading(true);
    const payload = {
      amount: parseFloat(form.amount),
      category: form.category,
      date: formatDateForAPI(form.date),
      note: form.note.trim(),
      paymentMethod: form.paymentMethod,
      isRecurring: form.isRecurring,
    };

    const result = isEdit
      ? await updateExpense(editExpense._id, payload)
      : await addExpense(payload);

    setIsLoading(false);

    if (result.success) {
      // Success animation
      Animated.sequence([
        Animated.spring(checkAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
        Animated.delay(600),
      ]).start(() => navigation.goBack());
    } else {
      Alert.alert('Error', result.message || 'Failed to save expense.');
      shakeForm();
    }
  };

  const dateStr = form.date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Success overlay */}
      <Animated.View style={[styles.successOverlay, {
        opacity: checkAnim,
        transform: [{ scale: checkAnim }],
        pointerEvents: checkAnim._value > 0.5 ? 'auto' : 'none',
      }]}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text style={styles.successText}>{isEdit ? 'Updated!' : 'Added!'}</Text>
      </Animated.View>

      <Animated.ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }}
        contentContainerStyle={{ padding: SPACING.base, paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Edit Expense' : 'New Expense'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Amount input - Hero */}
        <Animated.View style={[styles.amountCard, { transform: [{ scale: amountScale }] }]}>
          <View style={styles.amountGlow} />
          <Text style={styles.amountLabel}>AMOUNT</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={form.amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
              maxLength={10}
            />
          </View>
          {errors.amount ? <Text style={styles.amountError}>{errors.amount}</Text> : null}
        </Animated.View>

        {/* Date picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DATE</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateArrow} onPress={() => handleDateChange(-1)}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>
            <TouchableOpacity style={styles.dateArrow} onPress={() => handleDateChange(1)}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
          {errors.date ? <Text style={styles.fieldError}>{errors.date}</Text> : null}
        </View>

        {/* Category grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORY {errors.category ? <Text style={styles.errorLabel}>— {errors.category}</Text> : null}</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const meta = CATEGORY_META[cat];
              const isSelected = form.category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryItem, isSelected && { backgroundColor: meta.color + '25', borderColor: meta.color }]}
                  onPress={() => { setForm(prev => ({ ...prev, category: cat })); setErrors(prev => ({ ...prev, category: null })); }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.catEmoji}>{meta.icon}</Text>
                  <Text style={[styles.catLabel, isSelected && { color: meta.color }]} numberOfLines={1}>{cat.replace(' & ', '\n& ')}</Text>
                  {isSelected && <View style={[styles.catCheck, { backgroundColor: meta.color }]}><Text style={styles.catCheckText}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Payment method */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm }}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = form.paymentMethod === method;
              return (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentChip, isSelected && styles.paymentChipActive]}
                  onPress={() => setForm(prev => ({ ...prev, paymentMethod: method }))}
                >
                  <Text style={styles.paymentIcon}>{PAYMENT_ICONS[method]}</Text>
                  <Text style={[styles.paymentText, isSelected && styles.paymentTextActive]}>{method}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={styles.noteInput}
            value={form.note}
            onChangeText={(v) => setForm(prev => ({ ...prev, note: v }))}
            placeholder="Add a note about this expense..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.noteCount}>{form.note.length}/500</Text>
        </View>

        {/* Recurring toggle */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setForm(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>🔄</Text>
              <View>
                <Text style={styles.toggleLabel}>Recurring Expense</Text>
                <Text style={styles.toggleSub}>Mark this as a monthly recurring expense</Text>
              </View>
            </View>
            <View style={[styles.toggle, form.isRecurring && styles.toggleActive]}>
              <View style={[styles.toggleThumb, form.isRecurring && styles.toggleThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.bg} />
          ) : (
            <Text style={styles.submitText}>{isEdit ? 'Update Expense' : 'Save Expense'} ✓</Text>
          )}
        </TouchableOpacity>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  successOverlay: {
    position: 'absolute', zIndex: 100, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center',
  },
  successCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: COLORS.success + '20', borderWidth: 2, borderColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  successCheck: { fontSize: 36, color: COLORS.success },
  successText: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.base },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: COLORS.textPrimary },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  amountCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl, alignItems: 'center',
    marginBottom: SPACING.base, overflow: 'hidden',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  amountGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  amountLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 2, marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 36, fontWeight: '800', color: COLORS.gold, marginRight: 6 },
  amountInput: { fontSize: 52, fontWeight: '800', color: COLORS.textPrimary, minWidth: 120 },
  amountError: { fontSize: 12, color: COLORS.error, marginTop: 8 },
  section: { marginBottom: SPACING.lg },
  sectionLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 2, marginBottom: SPACING.sm, fontWeight: '700' },
  errorLabel: { color: COLORS.error, letterSpacing: 0 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dateArrow: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  arrowText: { fontSize: 24, color: COLORS.gold, fontWeight: '300' },
  dateDisplay: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    paddingVertical: 12, paddingHorizontal: SPACING.base, alignItems: 'center',
  },
  dateText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  categoryItem: {
    width: '30%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderCard,
    padding: SPACING.sm, alignItems: 'center', position: 'relative',
  },
  catEmoji: { fontSize: 22, marginBottom: 5 },
  catLabel: { fontSize: 9, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600', lineHeight: 13 },
  catCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  catCheckText: { fontSize: 9, color: '#000', fontWeight: '800' },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 5 },
  paymentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.round,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  paymentChipActive: { backgroundColor: COLORS.bgCardElevated, borderColor: COLORS.gold },
  paymentIcon: { fontSize: 16 },
  paymentText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  paymentTextActive: { color: COLORS.gold, fontWeight: '700' },
  noteInput: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    padding: SPACING.md, fontSize: 14, color: COLORS.textPrimary,
    minHeight: 90,
  },
  noteCount: { fontSize: 11, color: COLORS.textMuted, textAlign: 'right', marginTop: 4 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderCard, padding: SPACING.md,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  toggleIcon: { fontSize: 22 },
  toggleLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  toggleSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  toggle: { width: 48, height: 26, borderRadius: 13, backgroundColor: COLORS.bgInput, justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: COLORS.gold },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.textMuted },
  toggleThumbActive: { backgroundColor: COLORS.bg, alignSelf: 'flex-end' },
  submitBtn: {
    backgroundColor: COLORS.gold, borderRadius: RADIUS.lg,
    paddingVertical: 17, alignItems: 'center', marginTop: SPACING.sm,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  submitText: { color: COLORS.bg, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
});
