// Payment types matching backend enum
// Using a const object + type alias to comply with `erasableSyntaxOnly` TypeScript flag.
export const PaymentType = {
  Nakit: 1,
  Kart: 2,
  Veresiye: 3,
} as const;
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

// Cart item in the local cart state
export interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

// Product returned from the API
export interface ProductDto {
  id: number;
  barcode: string;
  name: string;
  salePrice: number;
  taxRate: number;
  stockQuantity: number;
}

// Customer returned from the API
export interface CustomerDto {
  id: number;
  name: string;
  phone: string;
  balance: number;
}

// ---- Sale API types ----

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
  discountAmount: number;
}

/**
 * Payload sent to POST /api/sales.
 *
 * `paidAmount` is required so the backend knows how much cash was tendered
 * (important for cash-drawer change calculation and financial records).
 * `customerId` must be provided when paymentType is Veresiye.
 */
export interface CreateSaleRequest {
  customerId: number | null;
  paymentType: PaymentType;
  paidAmount: number;
  discountTotal: number;
  items: CreateSaleItemRequest[];
}

// Individual item in the sale response
export interface SaleItemResponseDto {
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}

// Full sale response from the API
export interface SaleResponseDto {
  id: number;
  receiptNumber: string;
  saleDate: string;
  subTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentType: string;
  status: string;
  cashierName: string;
  customerName: string | null;
  items: SaleItemResponseDto[];
}
