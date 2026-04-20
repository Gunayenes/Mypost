import api from './client';
import type { ApiResult, StockMovement, CreateStockMovementRequest, PagedData } from '@/types';

export const stockApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResult<PagedData<StockMovement>>>('/stock-movements', { params }),

  create: (data: CreateStockMovementRequest) =>
    api.post<ApiResult<StockMovement>>('/stock-movements', data),
};
