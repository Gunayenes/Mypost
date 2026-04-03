import api from './client';
import type { ApiResult, WebRegisterRequest, WebLoginResponse } from '@/types';

export const webAuthApi = {
  register: (data: WebRegisterRequest) =>
    api.post<ApiResult<WebLoginResponse>>('/web/register', data),

  forgotPassword: (email: string) =>
    api.post<ApiResult<void>>('/web/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<ApiResult<void>>('/web/reset-password', { token, newPassword }),

  confirmEmail: (token: string) =>
    api.get<ApiResult<void>>('/web/confirm-email', { params: { token } }),

  resendConfirmation: (email: string) =>
    api.post<ApiResult<void>>('/web/resend-confirmation', { email }),
};
