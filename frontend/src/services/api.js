// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Để gửi cookies
});

// Request interceptor - thêm token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH APIs ============
export const authAPI = {
  // Student login
  studentLogin: (classCode, studentCode, name) =>
    api.post('/auth/student-login', { classCode, studentCode, name }),

  // Teacher login
  teacherLogin: (email, password) =>
    api.post('/auth/login', { email, password }),

  // Get current user
  getMe: () => api.get('/auth/me'),

  // Logout
  logout: () => api.post('/auth/logout'),
};

// ============ FEELINGS APIs ============
export const feelingsAPI = {
  // Submit feeling
  submit: (emotion, message) =>
    api.post('/feelings', { emotion, message }),

  // Get today's feeling
  getToday: () => api.get('/feelings/today'),

  // Get my history
  getMyHistory: (days = 7) =>
    api.get(`/feelings/my-history?days=${days}`),

  // Get class today (teacher)
  getClassToday: (classId) =>
    api.get(`/feelings/class/${classId}/today`),

  // Get class stats (teacher)
  getClassStats: (classId, period = 'week') =>
    api.get(`/feelings/stats/${classId}?period=${period}`),
};

// ============ CLASSES APIs ============
export const classesAPI = {
  // Get my class (teacher)
  getMyClass: () => api.get('/classes/my-class'),

  // Get class students (teacher)
  getClassStudents: (classId) =>
    api.get(`/classes/${classId}/students`),
};

// ============ AI APIs ============
export const aiAPI = {
  // Analyze class
  analyzeClass: (classId, days = 7) =>
    api.get(`/ai/analyze-class/${classId}?days=${days}`),

  // Analyze student
  analyzeStudent: (studentId, days = 14) =>
    api.get(`/ai/analyze-student/${studentId}?days=${days}`),

  // Get AI status
  getStatus: () => api.get('/ai/status'),
};

// ============ DASHBOARD APIs ============
export const dashboardAPI = {
  // Teacher dashboard
  getTeacherDashboard: () => api.get('/dashboard/teacher'),

  // Admin dashboard
  getAdminDashboard: () => api.get('/dashboard/admin'),
};

export default api;