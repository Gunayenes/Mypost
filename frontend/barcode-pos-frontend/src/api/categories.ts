import api from './client';
import type { ApiResult, Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/types';

export const categoriesApi = {
  getAll: () =>
    api.get<ApiResult<Category[]>>('/categories'),

  getById: (id: number) =>
    api.get<ApiResult<Category>>(`/categories/${id}`),

  create: (data: CreateCategoryRequest) =>
    api.post<ApiResult<Category>>('/categories', data),

  update: (id: number, data: UpdateCategoryRequest) =>
    api.put<ApiResult<Category>>(`/categories/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResult<void>>(`/categories/${id}`),
};
