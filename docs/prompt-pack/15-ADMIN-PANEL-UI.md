# 🛠️ FAZ 3: Admin Panel UI

> Önkoşul: POS satış ekranı ve backend CRUD modülleri çalışıyor olmalı.

---

```plaintext
Generate the Admin Panel frontend for the POS system.

═══════════════════════════════════════
ADMIN LAYOUT
═══════════════════════════════════════

layouts/AdminLayout.tsx:

┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                 │
│  [Logo] BARCODE POS Admin    {FullName} ({Role})  [Çıkış]  │
├────────────┬────────────────────────────────────────────────┤
│  SIDEBAR   │  MAIN CONTENT AREA                            │
│            │                                                │
│  📊 Panel  │  (Router outlet)                              │
│  📦 Ürünler│                                                │
│  📂 Kategoriler                                             │
│  📊 Stok   │                                                │
│  🧾 Satışlar                                                │
│  👥 Müşteriler                                              │
│  👤 Kullanıcılar (Admin only)                               │
│  📈 Raporlar                                                │
│  🖥️ POS Ekranı (link)                                      │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘

Sidebar rules:
- Highlight active route
- Show/hide menu items based on user role
- Kullanıcılar menu: only visible to Admin
- Kâr/Zarar raporu: only visible to Admin
- Collapsible on smaller screens (optional)

═══════════════════════════════════════
PAGES TO GENERATE
═══════════════════════════════════════

1. DashboardPage (/admin)
   - Summary cards: Today's total, Sale count, Low stock count, Credit balance
   - Weekly sales chart placeholder (simple bar representation)
   - Top 5 selling products list
   - Low stock alerts (top 5)

2. ProductListPage (/admin/products)
   - DataTable with columns: Barkod, Ürün Adı, Kategori, Fiyat, Stok, Durum
   - Search input
   - Category filter dropdown
   - Low stock filter toggle
   - Pagination
   - [Yeni Ürün] button → navigate to form
   - Row click → navigate to edit form

3. ProductFormPage (/admin/products/new, /admin/products/:id/edit)
   - Form fields: Barkod, Ürün Adı, Açıklama, Kategori (dropdown), Alış Fiyatı, Satış Fiyatı, KDV Oranı, Stok Miktarı (only on create), Min Stok
   - Validation errors display
   - [Kaydet] [İptal] buttons
   - Load existing data in edit mode

4. CategoryListPage (/admin/categories)
   - Simple DataTable: Kategori Adı, Açıklama, Ürün Sayısı, Durum
   - Inline add/edit using modal
   - Delete with confirmation

5. StockMovementPage (/admin/stock)
   - Two sections:
     a. Manual stock entry form: Product search, Type (Giriş/Çıkış/Düzeltme), Quantity, Note
     b. Movement history table: Tarih, Ürün, İşlem Tipi, Miktar, Sonrası, Kullanıcı, Not
   - Filter by product, type, date range
   - Pagination

6. SalesListPage (/admin/sales)
   - DataTable: Fiş No, Tarih, Toplam, Ödeme Tipi, Durum, Kasiyer, Müşteri
   - Filter by date range, payment type, status
   - Pagination
   - Row click → sale detail modal or expand
   - [İptal] [İade] action buttons (Yonetici+)

7. CustomerListPage (/admin/customers)
   - DataTable: Ad Soyad, Telefon, Bakiye, Durum
   - Search input
   - [Yeni Müşteri] button
   - Row click → navigate to detail

8. CustomerDetailPage (/admin/customers/:id)
   - Customer info card
   - Balance summary
   - Transaction history table
   - [Tahsilat Al] button → payment modal
   - Payment modal: Amount input, Note, [Kaydet]

9. UserListPage (/admin/users) — Admin only
   - DataTable: Kullanıcı Adı, Ad Soyad, Rol, Durum
   - [Yeni Kullanıcı] button
   - Inline role change dropdown
   - Toggle active/inactive

10. ReportPage (/admin/reports)
    - Tab or section selector: Günlük | Dönemsel | En Çok Satan | Ödeme Dağılımı | Kâr/Zarar
    - Date range picker for each
    - Data display with simple tables
    - [Excel İndir] button per report
    - Kâr/Zarar tab: only visible to Admin

═══════════════════════════════════════
SHARED PATTERNS
═══════════════════════════════════════

- Use the shared DataTable component from frontend skeleton
- Consistent form patterns with validation
- Toast notifications for success/error
- Loading states for all API calls
- Empty states: "Kayıt bulunamadı"
- Confirmation dialogs for destructive actions
- Format all currency as ₺{amount} with 2 decimals
- Format dates as dd.MM.yyyy HH:mm

Output:
1. Admin layout with sidebar
2. All 10 page components
3. Admin-specific sub-components (forms, modals, cards)
4. API service integration for each page
5. Route definitions update
6. Role-based menu visibility logic
```
