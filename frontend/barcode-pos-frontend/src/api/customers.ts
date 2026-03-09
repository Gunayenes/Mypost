import api from './client';
import type { ApiResult, Customer, CreateCustomerRequest, PagedData } from '@/types';

export interface CustomerBalance {
  customerId: number;
  fullName: string;
  balance: number;
  totalDebt: number;
  totalPayment: number;
}

export interface CustomerTransaction {
  id: number;
  saleId?: number;
  type: string;
  typeName: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export const customersApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResult<PagedData<Customer>>>('/customers', { params }),

  getById: (id: number) =>
    api.get<ApiResult<Customer>>(`/customers/${id}`),

  create: (data: CreateCustomerRequest) =>
    api.post<ApiResult<Customer>>('/customers', data),

  update: (id: number, data: CreateCustomerRequest) =>
    api.put<ApiResult<Customer>>(`/customers/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResult<void>>(`/customers/${id}`),

  getBalance: (id: number) =>
    api.get<ApiResult<CustomerBalance>>(`/customers/${id}/balance`),

  getTransactions: (id: number, page = 1, pageSize = 50) =>
    api.get<ApiResult<PagedData<CustomerTransaction>>>(`/customers/${id}/transactions`, {
      params: { page, pageSize },
    }),

  collectPayment: (id: number, data: { amount: number; note?: string }) =>
    api.post<ApiResult<void>>(`/customers/${id}/payment`, data),
};
