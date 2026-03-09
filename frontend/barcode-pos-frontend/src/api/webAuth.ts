import api from './client';
import type { ApiResult, WebRegisterRequest, WebLoginResponse } from '@/types';

export const webAuthApi = {
  register: (data: WebRegisterRequest) =>
    api.post<ApiResult<WebLoginResponse>>('/web/register', data),
};
