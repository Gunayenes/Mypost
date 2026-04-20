import api from './client';
import type { ApiResult, SaleListItem, SaleDetail, CreateSaleRequest, PagedData } from '@/types';

export const salesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResult<PagedData<SaleListItem>>>('/sales', { params }),

  getById: (id: number) =>
    api.get<ApiResult<SaleDetail>>(`/sales/${id}`),

  create: (data: CreateSaleRequest) =>
    api.post<ApiResult<SaleDetail>>('/sales', data),

  cancel: (id: number) =>
    api.post<ApiResult<void>>(`/sales/${id}/cancel`),

  return: (id: number) =>
    api.post<ApiResult<void>>(`/sales/${id}/return`),
};
