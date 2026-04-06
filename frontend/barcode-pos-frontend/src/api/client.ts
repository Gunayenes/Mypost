import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Duplicate toast engelleme — aynı mesaj 3sn içinde tekrar gösterilmez
const recentToasts = new Map<string, number>();
function showToast(type: string, message: string) {
  const now = Date.now();
  const last = recentToasts.get(message) || 0;
  if (now - last < 3000) return; // 3sn içinde aynı mesajı tekrar gösterme
  recentToasts.set(message, now);
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
  // Eski kayıtları temizle
  if (recentToasts.size > 20) {
    for (const [key, time] of recentToasts) {
      if (now - time > 5000) recentToasts.delete(key);
    }
  }
}

// Request interceptor — JWT token ekle + expire kontrolü
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('error', 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
        return Promise.reject(new Error('Token expired'));
      }
    } catch { /* invalid token */ }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — 401 ise login'e, 403 lisans/abonelik ise uyar
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.licenseExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('error', 'Lisans geçersiz. Lütfen geliştiriciyle iletişime geçin.');
      window.location.href = '/';
      return Promise.reject(error);
    }
    if (error.response?.status === 403 && error.response?.data?.subscriptionExpired) {
      window.dispatchEvent(new CustomEvent('subscription-expired'));
      return Promise.reject(error);
    }
    if (error.response?.status === 403 && error.response?.data?.featureRestricted) {
      showToast('warning', error.response.data.message || 'Bu özellik mevcut planınızda kullanılamaz.');
      return Promise.reject(error);
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast('error', 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
      return Promise.reject(error);
    }
    if (error.response?.status >= 500) {
      const data = error.response?.data;
      const msg = data?.message || 'Sunucu hatası oluştu.';
      const errorId = data?.errorId ? ` (Hata kodu: ${data.errorId})` : '';
      showToast('error', `${msg}${errorId}`);
    }
    return Promise.reject(error);
  }
);

export default api;
