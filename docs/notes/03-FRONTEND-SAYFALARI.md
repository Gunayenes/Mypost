# BarcodePos — Frontend Sayfaları ve Bileşenler

## Sayfalar (11 adet)

### 1. LoginPage
- **Rota:** `/login`
- **Özellikler:** Kullanıcı adı/şifre, JWT token ile giriş, hata mesajı, şifre göster/gizle
- **Store:** `authStore` — token persist (localStorage)

### 2. DashboardPage
- **Rota:** `/`
- **Özellikler:**
  - Bugünkü satış özeti (adet, tutar, ortalama)
  - Haftalık satış trend grafiği
  - Düşük stok uyarıları

### 3. POSPage (Satış Noktası)
- **Rota:** `/pos`
- **Özellikler:**
  - Barkod okutma (USB okuyucu desteği — klavye emülasyonu)
  - Ürün arama (ad ile)
  - Kategori bazlı hızlı ürün seçimi
  - Sepet yönetimi (miktar +/-, silme)
  - KDV otomatik hesaplama
  - Ödeme tipleri: Nakit, Kredi Kartı, Karışık
  - Hızlı tutar butonları (1, 5, 10, 20, 50, 100, 200)
  - Para üstü hesaplama
  - Klavye kısayolları: F8 (Nakit), F9 (Kart), F10 (Satış tamamla)
  - Satış sonrası fiş yazdırma
- **Store:** `cartStore` — sepet state yönetimi

### 4. ProductsPage (Ürün Listesi)
- **Rota:** `/products`
- **Özellikler:**
  - Ürün tablosu (barkod, ad, kategori, fiyat, stok, durum)
  - Arama (ad/barkod)
  - Kategori filtresi
  - İstatistik kartları (toplam, aktif, düşük stok)
  - Düzenle butonu → ProductFormPage'e yönlendirme
  - Silme → ConfirmModal ile onay + Toast bildirim

### 5. ProductFormPage (Ürün Ekle/Düzenle)
- **Rota:** `/products/new` ve `/products/:id/edit`
- **Özellikler:**
  - Barkod ile ürün arama (mevcut → düzenle, yeni → oluştur)
  - Tab yapısı: Ürün Bilgisi / Diğer Detaylar
  - Otomatik kâr oranı hesaplama
  - KDV dahil fiyat göstergesi
  - Stok hareketleri tablosu (düzenlemede)
  - Barkod durum göstergesi (bekleniyor / mevcut / yeni)

### 6. CategoriesPage
- **Rota:** `/categories`
- **Özellikler:** CRUD, modal form, ürün sayısı gösterimi

### 7. CustomersPage
- **Rota:** `/customers`
- **Özellikler:** CRUD, telefon/e-posta, bakiye takibi, sayfalama

### 8. SalesPage
- **Rota:** `/sales`
- **Özellikler:**
  - Satış listesi (fiş no, tarih, kasiyer, ödeme, durum, tutar)
  - Detay modal (kalemler, KDV, toplam)
  - **İptal butonu** (🔴) — ConfirmModal ile onay
  - **İade butonu** (🟠) — ConfirmModal ile onay, stok geri yüklenir

### 9. StockPage
- **Rota:** `/stock`
- **Özellikler:** Stok hareketleri listesi, manuel giriş/çıkış/düzeltme formu

### 10. ReportsPage
- **Rota:** `/reports`
- **Özellikler:** Tarih aralığı seçimi, günlük kırılım tablosu, Excel export

### 11. UsersPage
- **Rota:** `/users`
- **Özellikler:** CRUD, rol atama (Admin/Yönetici/Kasiyer), aktif/pasif toggle

## UI Bileşenleri

### Layout
| Bileşen | Konum | Açıklama |
|---------|-------|----------|
| `AppLayout` | `components/layout/` | Ana düzen (sidebar + topbar + content) |
| `Sidebar` | `components/layout/` | Sol menü, 9 sayfa linki, daraltma özelliği |

### UI
| Bileşen | Konum | Açıklama |
|---------|-------|----------|
| `ToastContainer` | `components/ui/` | Global bildirim sistemi (success/error/info) |
| `ConfirmModal` | `components/ui/` | Onay dialog'u (silme, iptal, iade) |

### useToast Hook
```typescript
const toast = useToast();
toast.success('İşlem başarılı!');
toast.error('Hata oluştu.');
toast.info('Bilgilendirme.');
```

## State Management (Zustand)

### authStore
- `token`, `user`, `isAuthenticated`
- `login(data)` — Token + kullanıcı bilgisi kaydet
- `logout()` — localStorage temizle
- Token persist: localStorage

### cartStore
- `items[]`, `paymentType`, `paidAmount`
- `addProduct(product)` — Sepete ekle (varsa miktar artır)
- `updateQuantity(id, qty)` — Miktar güncelle
- `removeItem(id)` — Sepetten çıkar
- `getSubTotal()`, `getTaxTotal()`, `getGrandTotal()` — Hesaplamalar
- `getChange()` — Para üstü
- `clearCart()` — Sepeti sıfırla

## API Client'ları (9 adet)

| Dosya | Endpoint Grubu |
|-------|---------------|
| `auth.ts` | Login, şifre değiştirme |
| `dashboard.ts` | Dashboard özeti, raporlar |
| `products.ts` | Ürün CRUD, barkod sorgu, arama |
| `categories.ts` | Kategori CRUD |
| `sales.ts` | Satış CRUD, iptal, iade |
| `stock.ts` | Stok hareketleri |
| `customers.ts` | Müşteri CRUD |
| `users.ts` | Kullanıcı CRUD |
| `client.ts` | Axios instance, JWT interceptor, token expire kontrolü |

## Routing

```
/login                → LoginPage
/                     → DashboardPage
/pos                  → POSPage
/products             → ProductsPage
/products/new         → ProductFormPage (oluşturma)
/products/:id/edit    → ProductFormPage (düzenleme)
/categories           → CategoriesPage
/customers            → CustomersPage
/sales                → SalesPage
/stock                → StockPage
/reports              → ReportsPage
/users                → UsersPage
```

Tüm rotalar `ProtectedRoute` ile korunur — giriş yapılmadıysa `/login`'e yönlendirilir.
