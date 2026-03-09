import { create } from 'zustand';
import type { CartItem, Product } from '@/types';

interface CartState {
  items: CartItem[];
  customerId: number | null;
  paymentType: string;
  paidAmount: number;
  setCustomerId: (id: number | null) => void;
  setPaymentType: (type: string) => void;
  setPaidAmount: (amount: number) => void;
  addPaidAmount: (amount: number) => void;
  addProduct: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getSubTotal: () => number;
  getTaxTotal: () => number;
  getGrandTotal: () => number;
  getChange: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  paymentType: 'Nakit',
  paidAmount: 0,

  setCustomerId: (id) => set({ customerId: id }),
  setPaymentType: (type) => set({ paymentType: type }),
  setPaidAmount: (amount) => set({ paidAmount: amount }),
  addPaidAmount: (amount) => set((s) => ({ paidAmount: s.paidAmount + amount })),

  addProduct: (product: Product) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            productId: product.id,
            barcode: product.barcode,
            name: product.name,
            unitPrice: product.salePrice,
            taxRate: product.taxRate,
            quantity: 1,
            discountAmount: 0,
          },
        ],
      };
    });
  },

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),

  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.productId !== productId)
          : state.items.map((i) =>
              i.productId === productId ? { ...i, quantity } : i
            ),
    })),

  clearCart: () => set({ items: [], customerId: null, paymentType: 'Nakit', paidAmount: 0 }),

  getSubTotal: () =>
    get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity - i.discountAmount, 0),

  getTaxTotal: () =>
    get().items.reduce(
      (sum, i) => sum + (i.unitPrice * i.quantity - i.discountAmount) * (i.taxRate / 100),
      0
    ),

  getGrandTotal: () => get().getSubTotal() + get().getTaxTotal(),

  getChange: () => Math.max(0, get().paidAmount - get().getGrandTotal()),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));
