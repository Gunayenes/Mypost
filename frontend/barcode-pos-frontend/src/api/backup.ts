import api from './client';
import type { ApiResult } from '@/types';

export interface BackupInfo {
  fileName: string;
  fileSizeBytes: number;
  createdAt: string;
}

export interface BackupResult {
  fileName: string;
  fileSizeBytes: number;
  message: string;
}

export interface RestoreResult {
  message: string;
  preRestoreBackupFileName?: string;
}

export const backupApi = {
  /** Yeni yedek oluştur */
  create: () =>
    api.post<ApiResult<BackupResult>>('/backup'),

  /** Mevcut yedeklerin listesi */
  getList: () =>
    api.get<ApiResult<BackupInfo[]>>('/backup'),

  /** Yedek dosyasını indir */
  download: async (fileName: string) => {
    const response = await api.get(`/backup/${fileName}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /** Dosya yükleyerek geri yükle */
  restoreFromUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResult<RestoreResult>>('/backup/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Mevcut yedekten geri yükle */
  restoreFromExisting: (fileName: string) =>
    api.post<ApiResult<RestoreResult>>(`/backup/restore/${fileName}`),

  /** Yedek dosyasını sil */
  delete: (fileName: string) =>
    api.delete<ApiResult<void>>(`/backup/${fileName}`),
};
