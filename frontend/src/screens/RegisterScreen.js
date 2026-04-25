import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { GoldButton, InputField } from '../components/UIComponents';

export default function RegisterScreen({ navigation }) {
  const { register, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslate = useRef(new Animated.Value(40)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(headerTranslate, { toValue: 0, tension: 70, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(formTranslate, { toValue: 0, tension: 70, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    return () => clearError();
  }, []);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
    if (!password || password.length < 6) e.password = 'At least 6 characters required';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    await register(name.trim(), email.trim().toLowerCase(), password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Decorative orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: floatY }] }]} />
      <View style={[styles.orb, styles.orb2]} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Back + Header */}
        <Animated.View
          style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoMark}>
            <Text style={styles.logoIcon}>◈</Text>
          </View>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subheading}>Start your wealth journey today</Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formTranslate }] }]}>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          <InputField
            label="Full Name"
            value={name}
            onChangeText={t => { setName(t); setFormErrors(p => ({ ...p, name: '' })); }}
            placeholder="John Doe"
            autoCapitalize="words"
            error={formErrors.name}
          />

          <InputField
            label="Email"
            value={email}
            onChangeText={t => { setEmail(t); clearError(); setFormErrors(p => ({ ...p, email: '' })); }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="your@email.com"
            error={formErrors.email}
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={t => { setPassword(t); setFormErrors(p => ({ ...p, password: '' })); }}
            secureTextEntry={!showPass}
            placeholder="Min. 6 characters"
            error={formErrors.password}
            suffix={
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            }
          />

          <InputField
            label="Confirm Password"
            value={confirm}
            onChangeText={t => { setConfirm(t); setFormErrors(p => ({ ...p, confirm: '' })); }}
            secureTextEntry={!showPass}
            placeholder="Re-enter password"
            error={formErrors.confirm}
          />

          <GoldButton
            title="Create Account"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerBtn}
          />

          {/* Terms notice */}
          <Text style={styles.termsText}>
            By creating an account you agree to our Terms of Service & Privacy Policy
          </Text>

          <TouchableOpacity
            style={styles.switchLink}
            onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.accent + '07',
    borderWidth: 1,
    borderColor: COLORS.accent + '12',
    top: -80,
    left: -80,
  },
  orb2: {
    width: 180,
    height: 180,
    backgroundColor: COLORS.gold + '06',
    bottom: 40,
    right: -50,
  },
  header: { marginBottom: SPACING.xl },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  backIcon: { color: COLORS.gold, fontSize: 20, fontWeight: '700' },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.goldGlow,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoIcon: { fontSize: 26, color: COLORS.gold },
  heading: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subheading: { fontSize: FONTS.sizes.base, color: COLORS.textMuted },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  errorBanner: {
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  errorText: { color: COLORS.error, fontSize: FONTS.sizes.sm },
  registerBtn: { marginTop: SPACING.sm, width: '100%' },
  termsText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 16,
  },
  switchLink: { alignItems: 'center', marginTop: SPACING.base },
  switchText: { fontSize: FONTS.sizes.base, color: COLORS.textMuted },
  switchHighlight: { color: COLORS.gold, fontWeight: '700' },
});
