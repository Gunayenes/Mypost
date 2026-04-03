export interface SiteAdminLoginRequest {
  email: string;
  password: string;
}

export interface SiteAdminLoginResponse {
  token: string;
  email: string;
  expiresAt: string;
}

export interface SiteAdminDashboard {
  totalCustomers: number;
  activeCustomers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiringIn7Days: number;
  totalStores: number;
  passwordResetRequests: number;
  recentCustomers: RecentCustomerItem[];
}

export interface PasswordResetRequestItem {
  customerId: number;
  email: string;
  fullName: string;
  businessName: string;
  requestedAt: string;
  expiresAt: string;
}

export interface RecentCustomerItem {
  id: number;
  email: string;
  fullName: string;
  businessName: string;
  createdAt: string;
}

export interface SiteAdminCustomerListItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  phone?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  activePlan?: string;
  subscriptionExpiry?: string;
}

export interface SiteAdminCustomerDetail {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  phone?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  storeId: number;
  createdAt: string;
  subscriptions: SiteAdminSubscriptionItem[];
}

export interface SiteAdminSubscriptionItem {
  id: number;
  webCustomerId: number;
  customerEmail: string;
  customerName: string;
  businessName: string;
  planName: string;
  planSlug: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  daysRemaining: number;
}

// ── License Management ──
export interface LicenseListItem {
  id: number;
  customerName: string;
  machineId: string;
  phone: string;
  note: string;
  username: string;
  password: string;
  licenseKey: string;
  durationDays: number;
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
  status: string;
  daysLeft: number;
}

export interface LicenseStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  inactive: number;
}

export interface CreateLicenseRequest {
  customerName: string;
  machineId: string;
  phone?: string;
  note?: string;
  username: string;
  password: string;
  durationDays: number;
}

export interface RenewLicenseRequest {
  durationDays: number;
  password?: string;
}

export interface SystemInfo {
  apiVersion: string;
  environment: string;
  serverTime: string;
  mainDbSize: number;
  licenseDbSize: number;
  jwtSecretConfigured: boolean;
  adminEmailConfigured: boolean;
  adminPasswordConfigured: boolean;
  allowedOriginsConfigured: boolean;
  totalLicenses: number;
  activeLicenses: number;
}

export interface UpdateSiteAdminCustomerRequest {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  emailConfirmed: boolean;
}

export interface CreateSiteAdminCustomerRequest {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone?: string;
  password: string;
  planId?: number;
}
