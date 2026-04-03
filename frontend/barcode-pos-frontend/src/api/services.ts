import api from './client';
import type { ApiResult, PagedData, ServiceRecord, ServiceListItem, ServicePart, ServiceLog, ServiceTracking, ServiceSummary } from '@/types';

export const servicesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResult<PagedData<ServiceListItem>>>('/services', { params }),

  getSummary: () =>
    api.get<ApiResult<ServiceSummary>>('/services/summary'),

  getById: (id: number) =>
    api.get<ApiResult<ServiceRecord>>(`/services/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResult<ServiceRecord>>('/services', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResult<ServiceRecord>>(`/services/${id}`, data),

  updateStatus: (id: number, data: { status: string; note?: string; isInternal?: boolean }) =>
    api.patch<ApiResult<ServiceRecord>>(`/services/${id}/status`, data),

  updatePriority: (id: number, data: { priority: string }) =>
    api.patch<ApiResult<ServiceRecord>>(`/services/${id}/priority`, data),

  delete: (id: number) =>
    api.delete<ApiResult<void>>(`/services/${id}`),

  addPart: (id: number, data: Record<string, unknown>) =>
    api.post<ApiResult<ServicePart>>(`/services/${id}/parts`, data),

  removePart: (id: number, partId: number) =>
    api.delete<ApiResult<void>>(`/services/${id}/parts/${partId}`),

  addPayment: (id: number, data: { amount: number; note?: string }) =>
    api.post<ApiResult<ServiceRecord>>(`/services/${id}/payments`, data),

  addLog: (id: number, data: { description: string; isInternal: boolean }) =>
    api.post<ApiResult<ServiceLog>>(`/services/${id}/logs`, data),

  // Müşteri dış takip (auth gerektirmez)
  trackByNumber: (serviceNumber: string) =>
    api.get<ApiResult<ServiceTracking>>(`/services/track/${serviceNumber}`),

  trackByPhone: (phone: string) =>
    api.get<ApiResult<ServiceTracking[]>>(`/services/track/phone/${phone}`),
};
