import axios from 'axios';

// In production (Railway): VITE_API_URL = https://your-backend.railway.app
// In development: proxy via Vite to localhost:3001
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

export { SOCKET_URL };

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: inject JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor: handle 401 ────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (data) => api.post('/auth/login', data),
  me:             ()     => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ─── Workers ──────────────────────────────────────────────────────────────────
export const workersApi = {
  list:   (params) => api.get('/workers', { params }),
  stats:  ()       => api.get('/workers/stats'),
  get:    (id)     => api.get(`/workers/${id}`),
  create: (data)   => api.post('/workers', data),
  update: (id, data) => api.patch(`/workers/${id}`, data),
  delete: (id)     => api.delete(`/workers/${id}`),
};

// ─── Batches ──────────────────────────────────────────────────────────────────
export const batchesApi = {
  start:    (workerId)         => api.post('/batches/start',    { workerId }),
  progress: (workerId, action) => api.post('/batches/progress', { workerId, action }),
  finish:   (workerId)         => api.post('/batches/finish',   { workerId }),
  cancel:   (workerId)         => api.post('/batches/cancel',   { workerId }),
  active:   ()                 => api.get('/batches/active'),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list:    (params) => api.get('/payments', { params }),
  create:  (data)   => api.post('/payments', data),
  summary: ()       => api.get('/payments/summary'),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  daily:   (params) => api.get('/reports/daily',   { params }),
  weekly:  (params) => api.get('/reports/weekly',  { params }),
  payroll: ()       => api.get('/reports/payroll'),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers:       ()     => api.get('/admin/users'),
  createUser:     (data) => api.post('/admin/users', data),
  deleteUser:     (id)   => api.delete(`/admin/users/${id}`),
  resetCooldown:  (workerId) => api.post('/admin/workers/reset-cooldown', { workerId }),
  forceUnlock:    (workerId) => api.post('/admin/workers/force-unlock',   { workerId }),
  getAuditLogs:   ()     => api.get('/admin/audit-logs'),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  list:   ()           => api.get('/settings'),
  update: (key, value) => api.patch(`/settings/${key}`, { value: String(value) }),
};

// ─── Activity ─────────────────────────────────────────────────────────────────
export const activityApi = {
  list: () => api.get('/activity'),
};

export default api;
