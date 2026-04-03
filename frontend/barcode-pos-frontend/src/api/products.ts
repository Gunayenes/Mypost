import api from './client';
import type { ApiResult, Product, PagedData } from '@/types';

export const productsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResult<PagedData<Product>>>('/products', { params }),

  getById: (id: number) =>
    api.get<ApiResult<Product>>(`/products/${id}`),

  getByBarcode: (barcode: string) =>
    api.get<ApiResult<Product>>(`/products/barcode/${barcode}`),

  generateBarcode: () =>
    api.get<ApiResult<string>>('/products/generate-barcode'),

  search: (q: string) =>
    api.get<ApiResult<Product[]>>('/products/search', { params: { q } }),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResult<Product>>('/products', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResult<Product>>(`/products/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResult<void>>(`/products/${id}`),

  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResult<BulkImportResult>>('/products/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadTemplate: async () => {
    const res = await api.get('/products/import/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'urun-import-sablonu.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportProducts: async () => {
    const res = await api.get('/products/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `urunler-${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  skippedCount: number;
  errorCount: number;
  errors: { row: number; barcode: string; message: string }[];
}
