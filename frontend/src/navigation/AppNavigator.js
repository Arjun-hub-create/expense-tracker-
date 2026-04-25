import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, RADIUS, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// ─── Custom Animated Tab Bar ────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const tabs = state.routes;
  const tabIcons = { Dashboard: '◈', Expenses: '≡', Analytics: '◐' };
  const tabLabels = { Dashboard: 'Home', Expenses: 'Expenses', Analytics: 'Analytics' };
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = (width - 32) / tabs.length;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index * tabWidth,
      tension: 120,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabBar}>
      {/* Sliding indicator */}
      <Animated.View style={[styles.tabIndicator, { width: tabWidth - 16, transform: [{ translateX: indicatorAnim.interpolate({ inputRange: [0, tabWidth * (tabs.length - 1)], outputRange: [8, tabWidth * (tabs.length - 1) + 8] }) }] }]} />

      {tabs.map((route, index) => {
        const isFocused = state.index === index;
        const scaleAnim = useRef(new Animated.Value(1)).current;

        const onPress = () => {
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
          ]).start();
          if (!isFocused) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.name} style={styles.tabItem} onPress={onPress} activeOpacity={1}>
            <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{tabIcons[route.name]}</Text>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tabLabels[route.name]}</Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Main Tab Navigator ──────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack ──────────────────────────────────────────────────────────────
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}

// ─── Root Navigator ──────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <SplashScreen />;

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.tabBg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
    height: 68,
    ...SHADOWS.gold,
  },
  tabIndicator: {
    position: 'absolute',
    top: 8,
    height: 52,
    backgroundColor: COLORS.bgCardElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabContent: { alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 20, color: COLORS.tabInactive, marginBottom: 2 },
  tabIconActive: { color: COLORS.gold },
  tabLabel: { fontSize: 10, color: COLORS.tabInactive, fontWeight: '500' },
  tabLabelActive: { color: COLORS.gold, fontWeight: '700' },
});
