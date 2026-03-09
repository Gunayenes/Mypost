import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — JWT token ekle + expire kontrolü
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Token expire kontrolü
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' } }));
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }
    } catch { /* invalid token */ }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 ise login'e, 403 lisans ise sayfayı yenile
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.licenseExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Lisans geçersiz. Lütfen geliştiriciyle iletişime geçin.' } }));
      window.location.href = '/';
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'error', message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' } }));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
