// ── API Response Wrapper ──
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors: string[];
}

// Backend PagedResult<T> is wrapped in Result<PagedResult<T>>
// So the actual response is: { success, data: { items: [...], totalCount, page, pageSize } }
export interface PagedData<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ── Auth ──
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  username: string;
  fullName: string;
  role: string;
  expiresAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ── User ──
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UpdateUserRequest {
  fullName: string;
}

// ── Category ──
export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  productCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

// ── Product ──
export interface Product {
  id: number;
  categoryId: number;
  categoryName: string;
  barcode: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  costPriceUsd?: number | null;
  salePriceUsd?: number | null;
  exchangeRate?: number | null;
  taxRate: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  categoryId: number;
  barcode: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  costPriceUsd?: number | null;
  salePriceUsd?: number | null;
  exchangeRate?: number | null;
  taxRate: number;
  stockQuantity: number;
  minStockLevel: number;
}

export interface UpdateProductRequest {
  categoryId: number;
  barcode: string;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  costPriceUsd?: number | null;
  salePriceUsd?: number | null;
  exchangeRate?: number | null;
  taxRate: number;
  minStockLevel: number;
}

// ── Customer ──
export interface Customer {
  id: number;
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
}

// ── Sale ──
export interface SaleListItem {
  id: number;
  receiptNumber: string;
  saleDate: string;
  grandTotal: number;
  paymentTypeName: string;
  statusName: string;
  cashierName: string;
  customerName?: string;
  itemsSummary: string;
  itemCount: number;
}

export interface SaleDetail {
  id: number;
  receiptNumber: string;
  saleDate: string;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentType: string;
  paymentTypeName: string;
  status: string;
  statusName: string;
  cashierName: string;
  customerName?: string;
  items: SaleItemDetail[];
}

export interface SaleItemDetail {
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

export interface CreateSaleRequest {
  customerId?: number | null;
  paymentType: string;
  paidAmount: number;
  discountTotal: number;
  items: CreateSaleItemRequest[];
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
  discountAmount: number;
}

// ── Stock Movement ──
export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productBarcode: string;
  userId: number;
  userFullName: string;
  type: string;
  typeName: string;
  quantity: number;
  stockAfter: number;
  note?: string;
  createdAt: string;
}

export interface CreateStockMovementRequest {
  productId: number;
  type: string;
  quantity: number;
  note?: string;
}

// ── Reports ──
export interface DashboardData {
  todayTotal: number;
  todaySaleCount: number;
  lowStockCount: number;
  totalCreditBalance: number;
  yesterdayTotal: number;
  weeklyTrend: WeeklyTrend[];
  monthlyTrend: DailyTrend[];
  recentSales: RecentSale[];
}

export interface WeeklyTrend {
  date: string;
  dayName: string;
  total: number;
}

export interface DailyTrend {
  date: string;
  total: number;
  saleCount: number;
}

export interface RecentSale {
  id: number;
  receiptNumber: string;
  saleDate: string;
  grandTotal: number;
  paymentTypeName: string;
  statusName: string;
  customerName?: string;
  itemCount: number;
  itemsSummary: string;
}

// ── Web Auth (Kayıt / Giriş) ──
export interface WebRegisterRequest {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
}

export interface WebLoginRequest {
  email: string;
  password: string;
}

export interface WebLoginResponse {
  token: string;
  customerId: number;
  email: string;
  fullName: string;
  businessName: string;
  expiresAt: string;
}

// ── Cart (POS local state) ──
export interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  taxRate: number;
  quantity: number;
  discountAmount: number;
}

// ── Servis Modülü ──

export interface ServiceRecord {
  id: number;
  serviceNumber: string;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  assignedUserId?: number;
  assignedUserName?: string;
  receivedByUserName: string;
  deviceName: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceSerial?: string;
  deviceAccessories?: string;
  deviceCondition?: string;
  faultDescription: string;
  customerNote?: string;
  status: string;
  statusName: string;
  priority: string;
  priorityName: string;
  estimatedCompletionDate?: string;
  completedDate?: string;
  deliveredDate?: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  paidAmount: number;
  paymentStatus: string;
  paymentStatusName: string;
  createdAt: string;
  updatedAt?: string;
  logs: ServiceLog[];
  parts: ServicePart[];
}

export interface ServiceListItem {
  id: number;
  serviceNumber: string;
  customerName: string;
  customerPhone?: string;
  deviceName: string;
  deviceBrand?: string;
  deviceModel?: string;
  faultDescription: string;
  status: string;
  statusName: string;
  priority: string;
  priorityName: string;
  assignedUserName?: string;
  totalCost: number;
  paymentStatusName: string;
  estimatedCompletionDate?: string;
  deliveredDate?: string;
  createdAt: string;
}

export interface ServiceSummary {
  totalCount: number;
  kayitAcildiCount: number;
  incelemedeCount: number;
  onayBekliyorCount: number;
  parcaBekliyorCount: number;
  islemdeCount: number;
  tamamlandiCount: number;
  teslimEdildiCount: number;
  iptalEdildiCount: number;
  borcluCount: number;
}

export interface ServiceLog {
  id: number;
  userName: string;
  oldStatusName?: string;
  newStatusName?: string;
  description: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ServicePart {
  id: number;
  productId?: number;
  partName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  deductedFromStock: boolean;
  addedByUserName: string;
  createdAt: string;
}

export interface ServiceTracking {
  serviceNumber: string;
  deviceName: string;
  deviceBrand?: string;
  deviceModel?: string;
  faultDescription: string;
  statusName: string;
  estimatedCompletionDate?: string;
  completedDate?: string;
  deliveredDate?: string;
  totalCost: number;
  paidAmount: number;
  paymentStatusName: string;
  createdAt: string;
  logs: { statusName?: string; description: string; createdAt: string }[];
  parts: { partName: string; quantity: number; totalCost: number }[];
}
