import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Animated, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, CATEGORY_META } from '../utils/theme';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrencyFull, formatDate, groupExpensesByDate } from '../utils/helpers';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Healthcare', 'Housing', 'Education', 'Travel', 'Utilities', 'Personal Care', 'Investments', 'Other'];

export default function ExpensesScreen({ navigation }) {
  const { expenses, pagination, isLoading, isRefreshing, isLoadingMore, fetchExpenses, deleteExpense } = useExpenses();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);
  const searchDebounce = useRef(null);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadExpenses(true);
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(searchBarAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, [selectedCategory])
  );

  const loadExpenses = (reset = false) => {
    const params = { page: reset ? 1 : page, limit: 20, category: selectedCategory };
    if (search) params.search = search;
    fetchExpenses(params, !reset);
    if (reset) setPage(1);
  };

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchExpenses({ page: 1, limit: 20, category: selectedCategory, search: text }, false);
    }, 400);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination?.hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchExpenses({ page: nextPage, limit: 20, category: selectedCategory, search }, true);
    }
  };

  const handleDelete = (id, amount) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete this ${formatCurrencyFull(amount)} expense?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const result = await deleteExpense(id);
            if (!result.success) Alert.alert('Error', result.message);
          },
        },
      ]
    );
  };

  const grouped = groupExpensesByDate(expenses);

  const renderExpenseItem = ({ item, index }) => {
    const meta = CATEGORY_META[item.category] || CATEGORY_META['Other'];
    return (
      <ExpenseCard
        expense={item}
        meta={meta}
        index={index}
        onPress={() => navigation.navigate('ExpenseDetail', { expense: item })}
        onEdit={() => navigation.navigate('AddExpense', { expense: item })}
        onDelete={() => handleDelete(item._id, item.amount)}
      />
    );
  };

  const renderGroupHeader = (date) => (
    <View style={styles.groupHeader}>
      <Text style={styles.groupDate}>{date}</Text>
      <View style={styles.groupLine} />
    </View>
  );

  const flatData = grouped.reduce((acc, group) => {
    acc.push({ type: 'header', date: group.date, key: `h-${group.date}` });
    group.items.forEach(item => acc.push({ type: 'item', ...item, key: item._id }));
    return acc;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.bgOrb} />

      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.subtitle}>{pagination?.total || 0} total records</Text>
      </Animated.View>

      {/* Search */}
      <Animated.View style={[styles.searchContainer, { opacity: searchBarAnim, transform: [{ translateY: searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search expenses..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => { setSearch(''); loadExpenses(true); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {/* Category filter pills */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, { opacity: searchBarAnim }]}
        contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm, gap: SPACING.sm }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const meta = CATEGORY_META[cat];
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
            >
              {meta && <Text style={styles.pillEmoji}>{meta.icon}</Text>}
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.ScrollView>

      {/* List */}
      {isLoading && expenses.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>◈</Text>
          <Text style={styles.emptyTitle}>No expenses found</Text>
          <Text style={styles.emptyText}>{search ? 'Try a different search term.' : 'Add your first expense to get started.'}</Text>
          {!search && (
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddExpense', {})}>
              <Text style={styles.addBtnText}>+ Add Expense</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) =>
            item.type === 'header'
              ? renderGroupHeader(item.date)
              : renderExpenseItem({ item, index: item._id })
          }
          contentContainerStyle={{ paddingHorizontal: SPACING.base, paddingBottom: 100 }}
          refreshing={isRefreshing}
          onRefresh={() => loadExpenses(true)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color={COLORS.gold} style={{ marginVertical: 20 }} /> : null}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense', {})} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ExpenseCard({ expense, meta, onPress, onEdit, onDelete }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.expenseCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <TouchableOpacity style={styles.expenseCardInner} onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.expIcon, { backgroundColor: meta.color + '20' }]}>
          <Text style={styles.expEmoji}>{meta.icon}</Text>
        </View>
        <View style={styles.expInfo}>
          <Text style={styles.expCategory}>{expense.category}</Text>
          {expense.note ? <Text style={styles.expNote} numberOfLines={1}>{expense.note}</Text> : null}
          <Text style={styles.expDate}>{formatDate(expense.date)} · {expense.paymentMethod}</Text>
        </View>
        <View style={styles.expRight}>
          <Text style={styles.expAmount}>₹{parseFloat(expense.amount).toFixed(2)}</Text>
          <View style={styles.expActions}>
            <TouchableOpacity style={styles.expActionBtn} onPress={onEdit}>
              <Text style={styles.expActionEdit}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.expActionBtn} onPress={onDelete}>
              <Text style={styles.expActionDelete}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgOrb: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.xl, paddingBottom: SPACING.sm },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    marginHorizontal: SPACING.base, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, paddingVertical: 13, color: COLORS.textPrimary, fontSize: 14 },
  clearBtn: { color: COLORS.textMuted, fontSize: 16, padding: 4 },
  filterScroll: { maxHeight: 52 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.round,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  filterPillActive: { backgroundColor: COLORS.bgCardElevated, borderColor: COLORS.gold },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  pillTextActive: { color: COLORS.gold, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.textMuted, marginTop: 12, fontSize: 13 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  emptyEmoji: { fontSize: 40, color: COLORS.gold, opacity: 0.3, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  addBtn: {
    marginTop: SPACING.base, backgroundColor: COLORS.gold,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: 12,
  },
  addBtnText: { color: COLORS.bg, fontWeight: '800', fontSize: 14 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.sm, gap: SPACING.sm },
  groupDate: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  groupLine: { flex: 1, height: 1, backgroundColor: COLORS.borderCard },
  expenseCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.borderCard,
  },
  expenseCardInner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  expIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  expEmoji: { fontSize: 20 },
  expInfo: { flex: 1 },
  expCategory: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  expNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  expDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  expRight: { alignItems: 'flex-end' },
  expAmount: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  expActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  expActionBtn: { padding: 3 },
  expActionEdit: { fontSize: 14, color: COLORS.gold },
  expActionDelete: { fontSize: 13, color: COLORS.error },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  fabIcon: { fontSize: 26, color: COLORS.bg, fontWeight: '300', lineHeight: 30 },
});
