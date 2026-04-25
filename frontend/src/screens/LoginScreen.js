import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { validateAuthForm } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const formSlide = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Floating orbs
    const floatOrb1 = Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Y, { toValue: -20, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb1Y, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    );
    const floatOrb2 = Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Y, { toValue: 15, duration: 2500, useNativeDriver: true }),
        Animated.timing(orb2Y, { toValue: -15, duration: 2500, useNativeDriver: true }),
      ])
    );
    setTimeout(() => floatOrb1.start(), 0);
    setTimeout(() => floatOrb2.start(), 500);
  }, []);

  const toggleMode = () => {
    Animated.sequence([
      Animated.timing(formSlide, { toValue: 20, duration: 150, useNativeDriver: true }),
      Animated.timing(formSlide, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    setIsLogin(!isLogin);
    setErrors({});
    setSubmitError('');
    setForm({ name: '', email: '', password: '' });
  };

  const shakeForm = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    const validationErrors = validateAuthForm({ ...form, isRegister: !isLogin });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      shakeForm();
      return;
    }
    setErrors({});
    setSubmitError('');

    const result = isLogin
      ? await login(form.email.trim(), form.password)
      : await register(form.name.trim(), form.email.trim(), form.password);

    if (!result.success) {
      setSubmitError(result.message);
      shakeForm();
    }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Background orbs */}
      <Animated.View style={[styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb2, { transform: [{ translateY: orb2Y }] }]} />
      <View style={styles.orb3} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>◈</Text>
          </View>
          <Text style={styles.appName}>AURUM</Text>
          <Text style={styles.appTagline}>Your wealth, beautifully tracked</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: formSlide }, { translateX: shakeAnim }] }
        ]}>
          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tab, isLogin && styles.tabActive]} onPress={() => !isLogin && toggleMode()}>
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, !isLogin && styles.tabActive]} onPress={() => isLogin && toggleMode()}>
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Error banner */}
          {submitError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠ {submitError}</Text>
            </View>
          ) : null}

          {/* Fields */}
          {!isLogin && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textMuted}
                value={form.name}
                onChangeText={(v) => updateForm('name', v)}
                autoCapitalize="words"
              />
              {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={form.email}
              onChangeText={(v) => updateForm('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Min. 6 characters"
                placeholderTextColor={COLORS.textMuted}
                value={form.password}
                onChangeText={(v) => updateForm('password', v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.submitText}>{isLogin ? 'Sign In →' : 'Create Account →'}</Text>
            )}
          </TouchableOpacity>

          {/* Footer note */}
          <Text style={styles.footerNote}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.footerLink} onPress={toggleMode}>
              {isLogin ? 'Register' : 'Sign In'}
            </Text>
          </Text>
        </Animated.View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecor}>
          <View style={styles.decorLine} />
          <Text style={styles.decorText}>◈</Text>
          <View style={styles.decorLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.base, paddingVertical: SPACING.xxxl },
  orb1: {
    position: 'absolute', top: -60, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(201,168,76,0.07)',
  },
  orb2: {
    position: 'absolute', bottom: 100, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(124,92,191,0.08)',
  },
  orb3: {
    position: 'absolute', top: '40%', right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(78,205,196,0.05)',
  },
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoMark: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5, borderColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  logoIcon: { fontSize: 30, color: COLORS.gold },
  appName: { fontSize: 26, fontWeight: '800', color: COLORS.gold, letterSpacing: 10 },
  appTagline: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 1.5, marginTop: 6 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5, shadowRadius: 32, elevation: 16,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md, padding: 3, marginBottom: SPACING.xl,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.bgCardElevated, borderWidth: 1, borderColor: COLORS.border },
  tabText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.gold },
  errorBanner: {
    backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    padding: SPACING.md, marginBottom: SPACING.base,
  },
  errorBannerText: { color: COLORS.error, fontSize: 13, textAlign: 'center' },
  fieldGroup: { marginBottom: SPACING.base },
  label: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 7, letterSpacing: 0.5, fontWeight: '600', textTransform: 'uppercase' },
  input: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.borderLight,
    padding: 14, fontSize: 15, color: COLORS.textPrimary, width: '100%',
  },
  inputError: { borderColor: COLORS.error },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  eyeIcon: { fontSize: 18 },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 5 },
  submitBtn: {
    backgroundColor: COLORS.gold, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', marginTop: SPACING.base,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  submitText: { color: COLORS.bg, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  footerNote: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.base },
  footerLink: { color: COLORS.gold, fontWeight: '700' },
  bottomDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.xxl, gap: 12 },
  decorLine: { width: 60, height: 0.5, backgroundColor: COLORS.border },
  decorText: { color: COLORS.gold, opacity: 0.4, fontSize: 14 },
});
