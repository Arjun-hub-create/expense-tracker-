import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...state, token: action.token, user: action.user, isAuthenticated: !!action.token, isLoading: false };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.user, token: action.token, isAuthenticated: true, isLoading: false, error: null };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.user };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.error, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const [tokenEntry, userEntry] = await AsyncStorage.multiGet(['token', 'user']);
        const savedToken = tokenEntry[1];
        const savedUser = userEntry[1] ? JSON.parse(userEntry[1]) : null;
        if (savedToken && savedUser) {
          try {
            const res = await authAPI.getMe();
            dispatch({ type: 'RESTORE_TOKEN', token: savedToken, user: res.data.user });
          } catch {
            await AsyncStorage.multiRemove(['token', 'user']);
            dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
          }
        } else {
          dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
        }
      } catch {
        dispatch({ type: 'RESTORE_TOKEN', token: null, user: null });
      }
    };
    restoreAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', value: true });
      const res = await authAPI.login({ email, password });
      const { token, user } = res.data;
      await AsyncStorage.multiSet([['token', token], ['user', JSON.stringify(user)]]);
      dispatch({ type: 'LOGIN_SUCCESS', token, user });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error.userMessage });
      return { success: false, message: error.userMessage };
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', value: true });
      const res = await authAPI.register({ name, email, password });
      const { token, user } = res.data;
      await AsyncStorage.multiSet([['token', token], ['user', JSON.stringify(user)]]);
      dispatch({ type: 'LOGIN_SUCCESS', token, user });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error.userMessage });
      return { success: false, message: error.userMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback(async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      const updatedUser = res.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'UPDATE_USER', user: updatedUser });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.userMessage };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
