import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { expenseAPI } from '../services/api';

const ExpenseContext = createContext(null);

const initialState = {
  expenses: [],
  summary: null,
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
  filters: { category: 'All', startDate: null, endDate: null, sortBy: 'date', order: 'desc' },
};

function expenseReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.value };
    case 'SET_REFRESHING': return { ...state, isRefreshing: action.value };
    case 'SET_LOADING_MORE': return { ...state, isLoadingMore: action.value };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.expenses, pagination: action.pagination, isLoading: false, isRefreshing: false, error: null };
    case 'APPEND_EXPENSES':
      return { ...state, expenses: [...state.expenses, ...action.expenses], pagination: action.pagination, isLoadingMore: false };
    case 'SET_SUMMARY': return { ...state, summary: action.summary };
    case 'ADD_EXPENSE': return { ...state, expenses: [action.expense, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return { ...state, expenses: state.expenses.map(e => e._id === action.expense._id ? action.expense : e) };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter(e => e._id !== action.id) };
    case 'SET_ERROR': return { ...state, error: action.error, isLoading: false, isRefreshing: false };
    case 'SET_FILTERS': return { ...state, filters: { ...state.filters, ...action.filters } };
    default: return state;
  }
}

export function ExpenseProvider({ children }) {
  const [state, dispatch] = useReducer(expenseReducer, initialState);

  const fetchExpenses = useCallback(async (params = {}, append = false) => {
    try {
      if (append) dispatch({ type: 'SET_LOADING_MORE', value: true });
      else if (params.refresh) dispatch({ type: 'SET_REFRESHING', value: true });
      else dispatch({ type: 'SET_LOADING', value: true });

      const res = await expenseAPI.getAll(params);
      const { data, pagination } = res.data;

      if (append) dispatch({ type: 'APPEND_EXPENSES', expenses: data, pagination });
      else dispatch({ type: 'SET_EXPENSES', expenses: data, pagination });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error.userMessage });
    }
  }, []);

  const fetchSummary = useCallback(async (month, year) => {
    try {
      const res = await expenseAPI.getSummary({ month, year });
      dispatch({ type: 'SET_SUMMARY', summary: res.data.data });
    } catch (error) {
      console.error('Summary fetch error:', error);
    }
  }, []);

  const addExpense = useCallback(async (data) => {
    try {
      const res = await expenseAPI.create(data);
      dispatch({ type: 'ADD_EXPENSE', expense: res.data.data });
      return { success: true, data: res.data.data };
    } catch (error) {
      return { success: false, message: error.userMessage };
    }
  }, []);

  const updateExpense = useCallback(async (id, data) => {
    try {
      const res = await expenseAPI.update(id, data);
      dispatch({ type: 'UPDATE_EXPENSE', expense: res.data.data });
      return { success: true, data: res.data.data };
    } catch (error) {
      return { success: false, message: error.userMessage };
    }
  }, []);

  const deleteExpense = useCallback(async (id) => {
    try {
      await expenseAPI.delete(id);
      dispatch({ type: 'DELETE_EXPENSE', id });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.userMessage };
    }
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: 'SET_FILTERS', filters });
  }, []);

  return (
    <ExpenseContext.Provider value={{
      ...state, fetchExpenses, fetchSummary, addExpense, updateExpense, deleteExpense, setFilters,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
}
