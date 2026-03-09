# 🔌 API Endpoint Tasarımı

## Kimlik Doğrulama

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `POST` | `/api/auth/login` | Herkese açık | Giriş, JWT döner |
| `POST` | `/api/auth/refresh` | Authenticated | Token yenile |
| `POST` | `/api/auth/change-password` | Authenticated | Şifre değiştir |

---

## Ürünler

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/api/products/barcode/{barcode}` | Kasiyer+ | Barkodla ürün bul (POS ana sorgu) |
| `GET` | `/api/products` | Yönetici+ | Ürün listesi (sayfalı, filtrelenebilir) |
| `GET` | `/api/products/{id}` | Yönetici+ | Ürün detay |
| `POST` | `/api/products` | Yönetici+ | Yeni ürün ekle |
| `PUT` | `/api/products/{id}` | Yönetici+ | Ürün güncelle |
| `DELETE` | `/api/products/{id}` | Admin | Ürün sil (soft delete) |
| `GET` | `/api/products/low-stock` | Yönetici+ | Minimum stok altındaki ürünler |
| `GET` | `/api/products/search?q={query}` | Kasiyer+ | İsim/barkod ile arama |

---

## Kategoriler

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/api/categories` | Yönetici+ | Tüm kategoriler |
| `GET` | `/api/categories/{id}` | Yönetici+ | Kategori detay |
| `POST` | `/api/categories` | Yönetici+ | Yeni kategori |
| `PUT` | `/api/categories/{id}` | Yönetici+ | Kategori güncelle |
| `DELETE` | `/api/categories/{id}` | Admin | Kategori sil |

---

## Satışlar

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `POST` | `/api/sales` | Kasiyer+ | **Yeni satış oluştur** (ana satış endpoint) |
| `GET` | `/api/sales/{id}` | Kasiyer+ | Satış detay (fiş görüntüleme) |
| `GET` | `/api/sales` | Yönetici+ | Satış listesi (sayfalı, filtrelenebilir) |
| `POST` | `/api/sales/{id}/cancel` | Yönetici+ | Satış iptal |
| `POST` | `/api/sales/{id}/return` | Yönetici+ | İade işlemi |
| `GET` | `/api/sales/receipt/{receiptNumber}` | Kasiyer+ | Fiş no ile arama |

### POST `/api/sales` Request Body

```json
{
  "customerId": null,
  "paymentType": 1,
  "discountTotal": 0,
  "items": [
    {
      "productId": 42,
      "quantity": 2,
      "discountAmount": 0
    },
    {
      "productId": 15,
      "quantity": 1,
      "discountAmount": 1.50
    }
  ]
}
```

### POST `/api/sales` Response

```json
{
  "id": 1001,
  "receiptNumber": "FIS-20260306-0042",
  "saleDate": "2026-03-06T14:30:00",
  "subTotal": 45.50,
  "taxTotal": 8.19,
  "discountTotal": 1.50,
  "grandTotal": 52.19,
  "paymentType": "Nakit",
  "status": "Tamamlandi",
  "cashierName": "Ahmet Yılmaz",
  "customerName": null,
  "items": [
    {
      "productName": "Coca Cola 1L",
      "barcode": "8690000000001",
      "quantity": 2,
      "unitPrice": 15.00,
      "lineTotal": 30.00
    },
    {
      "productName": "Ülker Çikolata",
      "barcode": "8690000000015",
      "quantity": 1,
      "unitPrice": 15.50,
      "discountAmount": 1.50,
      "lineTotal": 14.00
    }
  ]
}
```

---

## Stok Hareketleri

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `POST` | `/api/stock/movement` | Yönetici+ | Manuel stok giriş/çıkış |
| `GET` | `/api/stock/movements` | Yönetici+ | Hareket geçmişi (filtrelenebilir) |
| `GET` | `/api/stock/movements/product/{productId}` | Yönetici+ | Ürüne özel hareketler |

### POST `/api/stock/movement` Request Body

```json
{
  "productId": 42,
  "type": 1,
  "quantity": 100,
  "note": "Tedarikçiden alım - Fatura #1234"
}
```

---

## Müşteriler

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/api/customers` | Kasiyer+ | Müşteri listesi |
| `GET` | `/api/customers/{id}` | Kasiyer+ | Müşteri detay + bakiye |
| `POST` | `/api/customers` | Yönetici+ | Yeni müşteri |
| `PUT` | `/api/customers/{id}` | Yönetici+ | Müşteri güncelle |
| `GET` | `/api/customers/{id}/balance` | Kasiyer+ | Veresiye bakiye özeti |
| `GET` | `/api/customers/{id}/transactions` | Yönetici+ | İşlem geçmişi |
| `POST` | `/api/customers/{id}/payment` | Yönetici+ | Veresiye tahsilat kaydı |
| `GET` | `/api/customers/search?q={query}` | Kasiyer+ | Müşteri arama |

---

## Kullanıcılar

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/api/users` | Admin | Kullanıcı listesi |
| `GET` | `/api/users/{id}` | Admin | Kullanıcı detay |
| `POST` | `/api/users` | Admin | Yeni kullanıcı oluştur |
| `PUT` | `/api/users/{id}` | Admin | Kullanıcı güncelle |
| `PUT` | `/api/users/{id}/role` | Admin | Rol değiştir |
| `PUT` | `/api/users/{id}/status` | Admin | Aktif/pasif yap |

---

## Raporlar

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/api/reports/daily?date={date}` | Yönetici+ | Günlük satış raporu |
| `GET` | `/api/reports/period?from={date}&to={date}` | Yönetici+ | Dönemsel satış raporu |
| `GET` | `/api/reports/top-products?from={date}&to={date}&limit={n}` | Yönetici+ | En çok satan ürünler |
| `GET` | `/api/reports/low-stock` | Yönetici+ | Düşük stok raporu |
| `GET` | `/api/reports/profit?from={date}&to={date}` | Admin | Kâr/zarar raporu |
| `GET` | `/api/reports/payment-summary?from={date}&to={date}` | Yönetici+ | Ödeme tipi dağılımı |
| `GET` | `/api/reports/export/excel?type={type}&from={date}&to={date}` | Yönetici+ | Excel export |

### Dashboard Özet Endpoint

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/api/dashboard/summary` | Yönetici+ | Günlük toplam, satış adedi, düşük stok sayısı |

---

## Offline Sync (Gelecek Faz)

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `POST` | `/api/sync/upload` | Kasiyer+ | Offline satışları gönder |
| `GET` | `/api/sync/products?since={timestamp}` | Kasiyer+ | Güncellenen ürünleri al |

---

## Yetki Matrisi

| Endpoint Grubu | Admin | Yönetici | Kasiyer |
|---------------|:-----:|:--------:|:-------:|
| Auth | ✅ | ✅ | ✅ |
| Products (okuma + barkod) | ✅ | ✅ | ✅ |
| Products (CRUD) | ✅ | ✅ | ❌ |
| Products (silme) | ✅ | ❌ | ❌ |
| Categories | ✅ | ✅ | ❌ |
| Sales (oluşturma) | ✅ | ✅ | ✅ |
| Sales (iptal/iade) | ✅ | ✅ | ❌ |
| Stock Movements | ✅ | ✅ | ❌ |
| Customers (okuma) | ✅ | ✅ | ✅ |
| Customers (CRUD) | ✅ | ✅ | ❌ |
| Users | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Reports (kâr/zarar) | ✅ | ❌ | ❌ |
