import axios from 'axios';
import type { CreateSaleRequest, SaleResponseDto } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const salesApi = {
  /**
   * POST /api/sales
   *
   * Creates a new sale. The request payload must include:
   * - `customerId`   — required for Veresiye (credit) payments
   * - `paidAmount`   — amount tendered by the customer
   * - `paymentType`  — Nakit / Kart / Veresiye
   * - `discountTotal`
   * - `items`
   */
  create: (data: CreateSaleRequest): Promise<SaleResponseDto> =>
    api.post<SaleResponseDto>('/sales', data).then((r) => r.data),
};
