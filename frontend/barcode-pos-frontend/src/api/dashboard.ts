import api from './client';
import type { ApiResult, DashboardData } from '@/types';

export const dashboardApi = {
  get: () =>
    api.get<ApiResult<DashboardData>>('/dashboard/summary'),
};

export const reportsApi = {
  salesReport: (startDate: string, endDate: string) =>
    api.get('/reports/period', { params: { from: startDate, to: endDate } }),

  dailyClosingReport: (date: string) =>
    api.get('/reports/daily-closing', { params: { date } }),

  profitReport: (startDate: string, endDate: string) =>
    api.get('/reports/profit', { params: { from: startDate, to: endDate } }),

  topProducts: (startDate: string, endDate: string, limit = 10) =>
    api.get('/reports/top-products', { params: { from: startDate, to: endDate, limit } }),

  lowStock: () =>
    api.get('/reports/low-stock'),

  paymentSummary: (startDate: string, endDate: string) =>
    api.get('/reports/payment-summary', { params: { from: startDate, to: endDate } }),

  exportExcel: (startDate: string, endDate: string, type = 'sales') =>
    api.get('/reports/export/excel', {
      params: { type, from: startDate, to: endDate },
      responseType: 'blob',
    }),
};
