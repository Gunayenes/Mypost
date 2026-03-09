import api from './client';
import type { ApiResult, User, CreateUserRequest, UpdateUserRequest } from '@/types';

export const usersApi = {
  getAll: () =>
    api.get<ApiResult<User[]>>('/users'),

  getById: (id: number) =>
    api.get<ApiResult<User>>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    api.post<ApiResult<User>>('/users', data),

  update: (id: number, data: UpdateUserRequest) =>
    api.put<ApiResult<User>>(`/users/${id}`, data),

  toggleStatus: (id: number) =>
    api.put<ApiResult<void>>(`/users/${id}/status`),
};
