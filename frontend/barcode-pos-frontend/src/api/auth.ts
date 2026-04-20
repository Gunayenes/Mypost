import api from './client';
import type { ApiResult, LoginRequest, LoginResponse } from '@/types';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResult<LoginResponse>>('/auth/login', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResult<void>>('/auth/change-password', data),
};
