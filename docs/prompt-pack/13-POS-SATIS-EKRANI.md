# 🛒 FAZ 2-F: POS Satış Ekranı

> Önkoşul: `12-LOGIN-AUTH-UI.md` fazı tamamlanmış ve login çalışıyor olmalı.

---

```plaintext
Generate the POS Sales Screen frontend module.

This is the main screen cashiers use all day. Optimize for speed and keyboard usage.

═══════════════════════════════════════
LAYOUT
═══════════════════════════════════════

Full-screen split layout (PosLayout):

┌─────────────────────────────────────────────────────────────┐
│  [Logo] BARCODE POS        Kasiyer: {fullName}    [Çıkış]  │
├──────────────────────────────────┬──────────────────────────┤
│  LEFT PANEL (60%)                │  RIGHT PANEL (40%)       │
│                                  │                          │
│  🔍 Barkod / Ürün Ara...        │  SEPET                   │
│  ─────────────────────────       │  ──────────────────      │
│                                  │                          │
│  Son eklenen ürün kartı:         │  Cart items list:        │
│  ┌─────────────────────────┐     │  - Name                  │
│  │  {ProductName}          │     │  - Qty x Price = Total   │
│  │  Barkod: {barcode}      │     │  - Delete / +/- buttons  │
│  │  Fiyat: ₺{salePrice}   │     │                          │
│  │  Stok: {stockQuantity}  │     │  ──────────────────      │
│  └─────────────────────────┘     │  Ara Toplam: ₺{sub}     │
│                                  │  KDV:        ₺{tax}     │
│                                  │  İndirim:   -₺{disc}    │
│                                  │  ──────────────────      │
│                                  │  TOPLAM:    ₺{grand}    │
│                                  │                          │
│                                  │  [NAKİT]  [KART]        │
│                                  │  [VERESİYE]              │
│                                  │                          │
│                                  │  [🗑️ Sepeti Temizle]     │
├──────────────────────────────────┴──────────────────────────┤
│  F1:Ürün Ara  F2:Müşteri  F8:Nakit  F9:Kart  F10:Veresiye │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════
CART STORE (Zustand)
═══════════════════════════════════════

store/cartStore.ts:

State:
- items: CartItem[]
- customerId: number | null
- customerName: string | null
- paymentType: PaymentType | null

CartItem:
- productId: number
- barcode: string
- name: string
- quantity: number
- unitPrice: number
- taxRate: number
- discountAmount: number
- lineTotal: number (computed: unitPrice * quantity - discountAmount)

Actions:
- addItem(product: ProductDto) → if exists increment qty, else add new
- removeItem(productId: number)
- updateQuantity(productId: number, quantity: number) → remove if qty <= 0
- setItemDiscount(productId: number, discount: number)
- setCustomer(customerId: number | null, customerName: string | null)
- setPaymentType(type: PaymentType)
- clearCart() → reset all state

Computed (as functions):
- subTotal() → sum of (unitPrice * quantity) for all items
- taxTotal() → sum of ((unitPrice * quantity - discountAmount) * taxRate)
- discountTotal() → sum of all item discountAmounts
- grandTotal() → subTotal - discountTotal + taxTotal
- itemCount() → total quantity count

═══════════════════════════════════════
BARCODE SCAN FLOW
═══════════════════════════════════════

1. useBarcodeScanner hook captures barcode string
2. Call GET /api/products/barcode/{barcode}
3. If found → addItem to cart, show product card
4. If not found → show error toast: "Ürün bulunamadı: {barcode}"
5. Play success/error sound (optional beep)

═══════════════════════════════════════
MANUAL SEARCH
═══════════════════════════════════════

- Search input field (also captures barcodes)
- On typing (debounced 300ms): call GET /api/products/search?q={query}
- Show dropdown results
- Click result → addItem to cart

═══════════════════════════════════════
PAYMENT FLOW
═══════════════════════════════════════

When payment button clicked (Nakit/Kart/Veresiye):

1. If Veresiye:
   - Open customer selection modal
   - Search customers: GET /api/customers/search?q={query}
   - Select customer → setCustomer in cart
2. Show confirmation modal:
   - "Toplam: ₺{grandTotal}"
   - "Ödeme: {paymentTypeName}"
   - If veresiye: "Müşteri: {customerName}"
   - [Onayla] [İptal]
3. On confirm:
   - POST /api/sales with cart data
   - Show receipt modal with sale details
   - Clear cart
4. On error:
   - Show error message
   - Do NOT clear cart

═══════════════════════════════════════
RECEIPT MODAL
═══════════════════════════════════════

After successful sale, show modal:
- Receipt number
- Date/time
- Cashier name
- Item list with quantities and prices
- Totals
- Payment type
- [Yeni Satış] button → close modal, ready for next

═══════════════════════════════════════
CUSTOMER SELECTION MODAL
═══════════════════════════════════════

For veresiye payment:
- Search input
- Results list: Name, Phone, Balance
- Select button per row
- Current balance warning if high

═══════════════════════════════════════
KEYBOARD SHORTCUTS
═══════════════════════════════════════

- Barkod + Enter → add product (via useBarcodeScanner)
- F1 → focus search input
- F2 → open customer modal
- F8 → trigger Nakit payment
- F9 → trigger Kart payment
- F10 → trigger Veresiye payment
- Esc → clear cart (with confirm dialog)
- Delete → remove selected item

═══════════════════════════════════════
FORMATTING
═══════════════════════════════════════

- Currency: ₺ symbol, 2 decimal places, thousands separator
- Large font for totals
- Desktop-optimized: no mobile breakpoints needed
- High contrast for readability

Output:
1. Cart store (store/cartStore.ts)
2. POS page (pages/pos/PosPage.tsx)
3. POS components:
   - ProductSearchBar
   - LastScannedProduct
   - CartPanel
   - CartItemRow
   - TotalsPanel
   - PaymentButtons
   - ReceiptModal
   - CustomerSelectModal
   - PaymentConfirmModal
4. POS layout updates
5. Keyboard shortcut integration
6. Currency formatting utility
7. API service integrations
```
