import axios from 'axios';
import type { ApiResult, PagedData } from '@/types';
import type {
  SiteAdminLoginRequest,
  SiteAdminLoginResponse,
  SiteAdminDashboard,
  SiteAdminCustomerListItem,
  SiteAdminCustomerDetail,
  SiteAdminSubscriptionItem,
  LicenseListItem,
  LicenseStats,
  CreateLicenseRequest,
  CreateSiteAdminCustomerRequest,
  RenewLicenseRequest,
  SystemInfo,
  UpdateSiteAdminCustomerRequest,
  PasswordResetRequestItem,
} from '@/types/siteAdmin';

const siteApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

siteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('site_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

siteApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('site_admin_token');
      window.location.href = '/site-admin/login';
    }
    return Promise.reject(error);
  }
);

export const siteAdminApi = {
  login: (data: SiteAdminLoginRequest) =>
    siteApi.post<ApiResult<SiteAdminLoginResponse>>('/site-admin/login', data),

  getDashboard: () =>
    siteApi.get<ApiResult<SiteAdminDashboard>>('/site-admin/dashboard'),

  getCustomers: (params: { search?: string; page?: number; pageSize?: number }) =>
    siteApi.get<ApiResult<PagedData<SiteAdminCustomerListItem>>>('/site-admin/customers', { params }),

  createCustomer: (data: CreateSiteAdminCustomerRequest) =>
    siteApi.post<ApiResult<SiteAdminCustomerDetail>>('/site-admin/customers', data),

  getCustomerDetail: (id: number) =>
    siteApi.get<ApiResult<SiteAdminCustomerDetail>>(`/site-admin/customers/${id}`),

  toggleCustomerActive: (id: number) =>
    siteApi.patch<ApiResult<void>>(`/site-admin/customers/${id}/toggle-active`),

  updateCustomer: (id: number, data: UpdateSiteAdminCustomerRequest) =>
    siteApi.put<ApiResult<void>>(`/site-admin/customers/${id}`, data),

  resetCustomerPassword: (id: number, newPassword: string) =>
    siteApi.post<ApiResult<void>>(`/site-admin/customers/${id}/reset-password`, { newPassword }),

  getSubscriptions: (params: { filter?: string; page?: number; pageSize?: number }) =>
    siteApi.get<ApiResult<PagedData<SiteAdminSubscriptionItem>>>('/site-admin/subscriptions', { params }),

  extendSubscription: (id: number, days: number) =>
    siteApi.patch<ApiResult<void>>(`/site-admin/subscriptions/${id}/extend`, { days }),

  cancelSubscription: (id: number) =>
    siteApi.patch<ApiResult<void>>(`/site-admin/subscriptions/${id}/cancel`),

  // ── Password Reset Requests ──
  getPasswordResetRequests: () =>
    siteApi.get<ApiResult<PasswordResetRequestItem[]>>('/site-admin/password-reset-requests'),

  dismissPasswordResetRequest: (customerId: number) =>
    siteApi.delete<ApiResult<void>>(`/site-admin/password-reset-requests/${customerId}`),

  // ── License Management ──
  getLicenseStats: () =>
    siteApi.get<ApiResult<LicenseStats>>('/site-admin/licenses/stats'),

  getLicenses: () =>
    siteApi.get<ApiResult<LicenseListItem[]>>('/site-admin/licenses'),

  createLicense: (data: CreateLicenseRequest) =>
    siteApi.post<ApiResult<{ licenseKey: string; id: number }>>('/site-admin/licenses', data),

  renewLicense: (id: number, data: RenewLicenseRequest) =>
    siteApi.post<ApiResult<{ licenseKey: string }>>(`/site-admin/licenses/${id}/renew`, data),

  toggleLicense: (id: number) =>
    siteApi.post<ApiResult<{ isActive: boolean }>>(`/site-admin/licenses/${id}/toggle`),

  deleteLicense: (id: number) =>
    siteApi.delete<ApiResult<void>>(`/site-admin/licenses/${id}`),

  // ── System / Settings ──
  getSystemInfo: () =>
    siteApi.get<ApiResult<SystemInfo>>('/site-admin/system-info'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    siteApi.post<ApiResult<void>>('/site-admin/change-password', data),

  // ── İletişim Mesajları ──
  getContactMessages: (params?: { unreadOnly?: boolean; page?: number; pageSize?: number }) =>
    siteApi.get<ApiResult<{
      items: Array<{
        id: number;
        fullName: string;
        email: string;
        phone?: string;
        businessName?: string;
        subject: string;
        message: string;
        isRead: boolean;
        readAt?: string;
        createdAt: string;
      }>;
      totalCount: number;
      totalPages: number;
      page: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    }>>('/contact', { params }),

  markContactRead: (id: number) =>
    siteApi.patch<ApiResult<void>>(`/contact/${id}/mark-read`),

  deleteContactMessage: (id: number) =>
    siteApi.delete<ApiResult<void>>(`/contact/${id}`),

  getUnreadContactCount: () =>
    siteApi.get<ApiResult<number>>('/contact/unread-count'),
};
