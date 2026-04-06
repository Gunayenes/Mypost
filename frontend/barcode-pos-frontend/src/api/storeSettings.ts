import api from './client';
import type { ApiResult } from '@/types';

export interface StoreSettings {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  logoPath?: string;
  themeColor?: string;
}

/** Logo URL'ini döndürür (dev: Vite proxy, prod: aynı origin) */
export function getLogoUrl(logoPath?: string | null): string | null {
  if (!logoPath) return null;
  return logoPath; // /uploads/logos/... — Vite proxy ve production'da direkt çalışır
}

export const storeSettingsApi = {
  get: () =>
    api.get<ApiResult<StoreSettings>>('/store-settings'),

  update: (data: { name?: string; address?: string; phone?: string; themeColor?: string }) =>
    api.put<ApiResult<void>>('/store-settings', data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResult<{ logoPath: string }>>('/store-settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteLogo: () =>
    api.delete<ApiResult<void>>('/store-settings/logo'),
};
