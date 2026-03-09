import { create } from 'zustand';
import type { LoginResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: Omit<LoginResponse, 'token'> | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) as Omit<LoginResponse, 'token'> : null;

  return {
    token,
    user,
    isAuthenticated: !!token,

    login: (data: LoginResponse) => {
      const { token: t, ...userInfo } = data;
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(userInfo));
      set({ token: t, user: userInfo, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
