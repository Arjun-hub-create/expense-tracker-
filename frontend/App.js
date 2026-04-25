import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import AppNavigator from './src/navigation/AppNavigator';

// Suppress common non-critical warnings in development
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'ViewPropTypes will be removed',
]);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
        <AuthProvider>
          <ExpenseProvider>
            <AppNavigator />
            <Toast
              config={{
                success: (props) => (
                  <Toast.Success
                    {...props}
                    style={{
                      backgroundColor: '#12121A',
                      borderLeftColor: '#6BCBA1',
                      borderLeftWidth: 4,
                    }}
                  />
                ),
                error: (props) => (
                  <Toast.Error
                    {...props}
                    style={{
                      backgroundColor: '#12121A',
                      borderLeftColor: '#FF6B6B',
                      borderLeftWidth: 4,
                    }}
                  />
                ),
              }}
            />
          </ExpenseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
