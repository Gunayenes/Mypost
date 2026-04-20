# BarcodePos — API Endpointleri

## Kimlik Doğrulama
Tüm endpointler (login hariç) JWT Bearer token gerektirir.
Header: `Authorization: Bearer <token>`

## Auth
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| POST | `/api/auth/login` | Giriş yap, JWT token al | Herkese açık |
| POST | `/api/auth/change-password` | Şifre değiştir | Giriş yapmış |

## Dashboard
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/dashboard/summary` | Bugünkü özet, haftalık trend, düşük stok | Admin, Yönetici |

## Products
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/products` | Ürün listesi (sayfalı, filtreleme) | Kasiyer+ |
| GET | `/api/products/{id}` | ID ile ürün detayı | Kasiyer+ |
| GET | `/api/products/barcode/{barcode}` | Barkod ile ürün sorgula (POS ana sorgusu) | Kasiyer+ |
| GET | `/api/products/search?q=` | Ürün arama (ad/barkod) | Kasiyer+ |
| GET | `/api/products/low-stock` | Düşük stoklu ürünler | Yönetici+ |
| POST | `/api/products` | Yeni ürün oluştur | Yönetici+ |
| PUT | `/api/products/{id}` | Ürün güncelle | Yönetici+ |
| DELETE | `/api/products/{id}` | Ürün sil (soft delete) | Admin |

## Categories
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/categories` | Tüm kategoriler | Kasiyer+ |
| POST | `/api/categories` | Yeni kategori | Yönetici+ |
| PUT | `/api/categories/{id}` | Kategori güncelle | Yönetici+ |
| DELETE | `/api/categories/{id}` | Kategori sil | Admin |

## Sales
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/sales` | Satış listesi (sayfalı) | Kasiyer+ |
| GET | `/api/sales/{id}` | Satış detayı (kalemler dahil) | Kasiyer+ |
| POST | `/api/sales` | Yeni satış oluştur | Kasiyer+ |
| POST | `/api/sales/{id}/cancel` | Satış iptal et | Yönetici+ |
| POST | `/api/sales/{id}/return` | Satış iade et (stok geri yüklenir) | Yönetici+ |

## Stock Movements
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/stock-movements` | Stok hareketleri (sayfalı, filtreleme) | Yönetici+ |
| POST | `/api/stock-movements` | Manuel stok hareketi (giriş/çıkış/düzeltme) | Yönetici+ |

## Customers
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/customers` | Müşteri listesi | Kasiyer+ |
| GET | `/api/customers/{id}` | Müşteri detayı | Kasiyer+ |
| POST | `/api/customers` | Yeni müşteri | Kasiyer+ |
| PUT | `/api/customers/{id}` | Müşteri güncelle | Yönetici+ |
| DELETE | `/api/customers/{id}` | Müşteri sil | Admin |

## Users
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/users` | Kullanıcı listesi | Admin |
| POST | `/api/users` | Yeni kullanıcı | Admin |
| PUT | `/api/users/{id}` | Kullanıcı güncelle | Admin |
| PATCH | `/api/users/{id}/toggle-active` | Aktif/pasif toggle | Admin |

## Reports
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/api/reports/period?from=&to=` | Tarih aralığı satış raporu | Yönetici+ |
| GET | `/api/reports/export/excel?type=sales&from=&to=` | Excel export | Yönetici+ |

## Health Check
| Method | Endpoint | Açıklama | Yetki |
|--------|----------|----------|-------|
| GET | `/health` | Sistem sağlık kontrolü | Herkese açık |

## Ortak Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "errors": []
}
```

## Sayfalı Response Format

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "totalCount": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

## Rol Hiyerarşisi

```
Admin → Yönetici → Kasiyer
  │         │          │
  │         │          └── POS satış, ürün/müşteri görüntüleme
  │         └── Ürün/stok yönetimi, raporlar, satış iptal/iade
  └── Kullanıcı yönetimi, silme işlemleri, tüm yetkiler
```
