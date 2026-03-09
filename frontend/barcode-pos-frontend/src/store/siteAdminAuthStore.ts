import { create } from 'zustand';

interface SiteAdminAuthState {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
}

export const useSiteAdminAuthStore = create<SiteAdminAuthState>((set) => {
  const token = localStorage.getItem('site_admin_token');
  const email = localStorage.getItem('site_admin_email');

  return {
    token,
    email,
    isAuthenticated: !!token,

    login: (token: string, email: string) => {
      localStorage.setItem('site_admin_token', token);
      localStorage.setItem('site_admin_email', email);
      set({ token, email, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('site_admin_token');
      localStorage.removeItem('site_admin_email');
      set({ token: null, email: null, isAuthenticated: false });
    },
  };
});
