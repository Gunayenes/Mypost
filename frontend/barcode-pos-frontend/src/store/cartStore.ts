import { create } from 'zustand';
import type { CartItem, PaymentType, ProductDto } from '../types';

interface CartState {
  items: CartItem[];
  customerId: number | null;
  customerName: string | null;
  paymentType: PaymentType | null;
  /** Amount tendered by the customer (relevant for cash payments). */
  paidAmount: number;

  // Actions
  addItem: (product: ProductDto) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setItemDiscount: (productId: number, discount: number) => void;
  setCustomer: (customerId: number | null, customerName: string | null) => void;
  setPaymentType: (type: PaymentType) => void;
  setPaidAmount: (amount: number) => void;
  clearCart: () => void;

  // Computed totals (functions so they always derive from current state)
  subTotal: () => number;
  taxTotal: () => number;
  discountTotal: () => number;
  grandTotal: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  paymentType: null,
  paidAmount: 0,

  addItem: (product) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? {
                  ...i,
                  quantity: i.quantity + 1,
                  lineTotal: (i.quantity + 1) * i.unitPrice - i.discountAmount,
                }
              : i
          ),
        };
      }
      const newItem: CartItem = {
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        taxRate: product.taxRate,
        discountAmount: 0,
        lineTotal: product.salePrice,
      };
      return { items: [...state.items, newItem] };
    }),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === productId
            ? {
                ...i,
                quantity,
                lineTotal: quantity * i.unitPrice - i.discountAmount,
              }
            : i
        ),
      };
    }),

  setItemDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? {
              ...i,
              discountAmount: discount,
              lineTotal: i.quantity * i.unitPrice - discount,
            }
          : i
      ),
    })),

  setCustomer: (customerId, customerName) => set({ customerId, customerName }),

  setPaymentType: (type) => set({ paymentType: type }),

  setPaidAmount: (amount) => set({ paidAmount: amount }),

  clearCart: () =>
    set({
      items: [],
      customerId: null,
      customerName: null,
      paymentType: null,
      paidAmount: 0,
    }),

  // Computed — always read latest state via get()
  subTotal: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

  taxTotal: () =>
    get().items.reduce(
      (sum, i) => sum + (i.unitPrice * i.quantity - i.discountAmount) * i.taxRate,
      0
    ),

  discountTotal: () =>
    get().items.reduce((sum, i) => sum + i.discountAmount, 0),

  grandTotal: () => {
    const { subTotal, taxTotal, discountTotal } = get();
    return subTotal() - discountTotal() + taxTotal();
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
