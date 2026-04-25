import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change to your local IP for physical device testing
// Android emulator: http://10.0.2.2:5000/api
// iOS simulator: http://localhost:5000/api
export const BASE_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED' ? 'Request timed out.' : null) ||
      (error.message === 'Network Error' ? 'No internet connection.' : null) ||
      'Something went wrong.';
    return Promise.reject({ ...error, userMessage: message });
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const expenseAPI = {
  getAll: (params = {}) => api.get('/expenses', { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  getSummary: (params = {}) => api.get('/expenses/summary', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  deleteMany: (ids) => api.delete('/expenses', { data: { ids } }),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
};

export default api;
