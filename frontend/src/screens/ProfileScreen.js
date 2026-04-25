import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, Animated, ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { getInitials, formatCurrencyFull } from '../utils/helpers';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

export default function ProfileScreen({ navigation }) {
  const { user, updateUser, logout, isLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    monthlyBudget: user?.monthlyBudget?.toString() || '',
    currency: user?.currency || 'INR',
  });
  const [saving, setSaving] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.8)).current;
  const cardAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ...cardAnims.map((a, i) =>
        Animated.sequence([Animated.delay(i * 80), Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: true })])
      ),
    ]).start();
  }, []);

  const handleSave = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      Alert.alert('Validation Error', 'Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    const result = await updateUser({
      name: form.name.trim(),
      monthlyBudget: parseFloat(form.monthlyBudget) || 0,
      currency: form.currency,
    });
    setSaving(false);
    if (result.success) {
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuItems = [
    { icon: '🔔', label: 'Notifications', sub: 'Manage alerts & reminders', onPress: () => Alert.alert('Coming Soon', 'Notifications feature coming soon!') },
    { icon: '🔒', label: 'Change Password', sub: 'Update your password', onPress: () => Alert.alert('Coming Soon', 'Password change coming soon!') },
    { icon: '📤', label: 'Export Data', sub: 'Download as CSV or PDF', onPress: () => Alert.alert('Coming Soon', 'Export feature coming soon!') },
    { icon: '🗑️', label: 'Clear All Data', sub: 'Permanently delete all expenses', onPress: () => Alert.alert('Warning', 'This action cannot be undone. This feature requires manual backend call.', [{ text: 'OK' }]) },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bgOrb} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.gold} size="small" />
            ) : (
              <Text style={styles.editBtn}>{editing ? 'Save' : 'Edit'}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Avatar */}
        <Animated.View style={[styles.avatarSection, { transform: [{ scale: avatarScale }], opacity: headerAnim }]}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            </View>
          </View>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={form.name}
              onChangeText={(v) => setForm(prev => ({ ...prev, name: v }))}
              autoFocus
            />
          ) : (
            <Text style={styles.userName}>{user?.name}</Text>
          )}
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>◈ Premium Member</Text>
          </View>
        </Animated.View>

        {/* Budget & Currency */}
        <Animated.View style={[styles.card, { opacity: cardAnims[0] }]}>
          <Text style={styles.cardTitle}>Financial Settings</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Monthly Budget</Text>
              <Text style={styles.settingDesc}>Set a spending limit for alerts</Text>
            </View>
            {editing ? (
              <TextInput
                style={styles.settingInput}
                value={form.monthlyBudget}
                onChangeText={(v) => setForm(prev => ({ ...prev, monthlyBudget: v.replace(/[^0-9.]/g, '') }))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
              />
            ) : (
              <Text style={styles.settingValue}>
                {user?.monthlyBudget ? formatCurrencyFull(user.monthlyBudget, user.currency) : 'Not set'}
              </Text>
            )}
          </View>
          <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: COLORS.borderCard, paddingTop: SPACING.base }]}>
            <View>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingDesc}>Your preferred display currency</Text>
            </View>
            {editing ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.currencyChip, form.currency === c && styles.currencyChipActive]}
                    onPress={() => setForm(prev => ({ ...prev, currency: c }))}
                  >
                    <Text style={[styles.currencyText, form.currency === c && { color: COLORS.gold }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>{user?.currency || 'INR'}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Account stats */}
        <Animated.View style={[styles.card, { opacity: cardAnims[1] }]}>
          <Text style={styles.cardTitle}>Account Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
            </Text>
          </View>
        </Animated.View>

        {/* Menu items */}
        <Animated.View style={[styles.card, { opacity: cardAnims[2] }]}>
          <Text style={styles.cardTitle}>Settings</Text>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.menuItem, i > 0 && { borderTopWidth: 1, borderTopColor: COLORS.borderCard }]} onPress={item.onPress} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View style={styles.menuInfo}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View style={{ opacity: cardAnims[3], paddingHorizontal: SPACING.base }}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Text style={styles.logoutIcon}>⏻</Text>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Version */}
        <Animated.View style={[styles.versionRow, { opacity: cardAnims[4] }]}>
          <Text style={styles.versionDeco}>◈</Text>
          <Text style={styles.versionText}>Aurum Expense Tracker v1.0.0</Text>
          <Text style={styles.versionDeco}>◈</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgOrb: {
    position: 'absolute', bottom: 100, right: -100, width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(201,168,76,0.04)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base, paddingTop: SPACING.xl },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: COLORS.textPrimary },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  editBtn: { fontSize: 14, color: COLORS.gold, fontWeight: '700' },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.xl },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.bgCardElevated, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: COLORS.gold },
  nameInput: {
    fontSize: 22, fontWeight: '800', color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: COLORS.gold,
    paddingVertical: 4, textAlign: 'center', minWidth: 180,
  },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  userEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  memberBadge: {
    marginTop: 10, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.round,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 5,
  },
  memberBadgeText: { fontSize: 11, color: COLORS.gold, fontWeight: '700', letterSpacing: 1 },
  card: {
    marginHorizontal: SPACING.base, marginBottom: SPACING.base,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.borderCard, padding: SPACING.base, ...SHADOWS.card,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.base, letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  settingDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  settingValue: { fontSize: 14, color: COLORS.gold, fontWeight: '700' },
  settingInput: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.sm, borderWidth: 1,
    borderColor: COLORS.gold, padding: 8, color: COLORS.textPrimary, fontSize: 14, minWidth: 100, textAlign: 'right',
  },
  currencyChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.round,
    backgroundColor: COLORS.bgInput, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  currencyChipActive: { borderColor: COLORS.gold, backgroundColor: COLORS.bgCardElevated },
  currencyText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  currencyBadge: {
    backgroundColor: COLORS.bgCardElevated, borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.border,
  },
  currencyBadgeText: { fontSize: 13, color: COLORS.gold, fontWeight: '700' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  infoLabel: { fontSize: 13, color: COLORS.textMuted },
  infoValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, gap: SPACING.md },
  menuIcon: { fontSize: 20 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  menuSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  menuArrow: { fontSize: 20, color: COLORS.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    paddingVertical: 15, backgroundColor: 'rgba(255,107,107,0.08)',
  },
  logoutIcon: { fontSize: 18, color: COLORS.error },
  logoutText: { fontSize: 15, color: COLORS.error, fontWeight: '700' },
  versionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.xl },
  versionDeco: { color: COLORS.gold, opacity: 0.3, fontSize: 12 },
  versionText: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.5 },
});
