import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const ring1Scale = useRef(new Animated.Value(0)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Scale = useRef(new Animated.Value(0)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Rings pulse
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale, { toValue: 1.8, duration: 2000, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(ring1Opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 1.8, duration: 2000, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring2Scale, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(ring2Opacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    }, 600);

    // Logo entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background particles */}
      {[...Array(6)].map((_, i) => (
        <View
          key={i}
          style={[styles.particle, {
            top: `${10 + i * 15}%`,
            left: `${5 + i * 16}%`,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            opacity: 0.3 + (i % 3) * 0.1,
          }]}
        />
      ))}

      {/* Glow rings */}
      <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>◈</Text>
        </View>
        <Text style={styles.logoText}>AURUM</Text>
        <View style={styles.logoLine} />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
        <Text style={styles.tagline}>Track wealth. Live smart.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    backgroundColor: COLORS.gold,
    borderRadius: 99,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.gold,
    width: 200,
    height: 200,
  },
  ring1: { borderColor: COLORS.goldLight },
  ring2: { borderColor: COLORS.gold },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: { fontSize: 36, color: COLORS.gold },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 12,
  },
  logoLine: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.gold,
    marginTop: 10,
    opacity: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
