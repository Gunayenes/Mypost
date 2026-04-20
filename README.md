# Cari Soft — Barkodlu Satış Noktası Yönetim Sistemi

Küçük ve orta ölçekli işletmeler için geliştirilmiş, barkod okuyucu destekli modern POS (Point of Sale) sistemi. Masaüstü (Electron) ve web olarak çalışır.

## Teknolojiler

### Backend
- **.NET 10** — ASP.NET Core Web API
- **Entity Framework Core + SQLite** — Sıfır kurulum veritabanı
- **JWT Authentication** — Rol tabanlı yetkilendirme (Admin, Yönetici, Kasiyer)
- **FluentValidation** — İstek doğrulama
- **Serilog** — Yapılandırılmış loglama
- **Clean Architecture** — Domain / Application / Infrastructure / API

### Frontend
- **React 19** + **TypeScript**
- **Vite 7** — Build toolchain
- **Tailwind CSS v4** — Utility-first styling
- **Zustand** — State management
- **React Query** — Server state
- **Axios** — HTTP client
- **Lucide React** — İkonlar
- **Electron 40** — Masaüstü uygulama

## Özellikler

### POS Uygulaması
| Modül | Açıklama |
|-------|----------|
| **POS Satış** | Barkod okutma, hızlı ürün arama, kategori butonları, F8/F9/F10 kısayolları |
| **Ürün Yönetimi** | Barkod ile ekle/düzenle, kategori filtresi, stok takibi, KDV hesaplama |
| **Stok Hareketleri** | Giriş/çıkış/düzeltme, satış & iade otomatik kayıt |
| **Satış Takibi** | Fiş detayı, iptal, iade, ödeme tipi filtreleme |
| **Müşteri Yönetimi** | Müşteri CRUD, veresiye bakiye takibi |
| **Raporlar** | Tarih aralığı satış raporu, günlük kırılım, Excel export |
| **Dashboard** | Bugünkü satış, haftalık trend, düşük stok uyarıları |
| **Kullanıcılar** | Rol tabanlı erişim (Admin/Yönetici/Kasiyer) |
| **Yedekleme** | Veritabanı yedek al/geri yükle |

### Web Platform
| Modül | Açıklama |
|-------|----------|
| **Tanıtım Sitesi** | Ana sayfa, özellikler, fiyatlandırma, iletişim |
| **Online Kayıt** | İşletme kaydı + otomatik deneme aboneliği |
| **Site Admin Paneli** | Müşteri/abonelik/lisans yönetimi |
| **Lisans Yönetimi** | Lisans üretme, yenileme, WhatsApp ile gönderme |

## Kurulum

### Gereksinimler
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### 1. Backend

```bash
cd backend/BarcodePos.API

# Çalıştır (SQLite — ek kurulum gerekmez)
dotnet run
# → http://localhost:5050
# → Swagger: http://localhost:5050/swagger
```

### 2. Frontend

```bash
cd frontend/barcode-pos-frontend

npm install
npm run dev
# → http://localhost:5173
```

### 3. Electron Masaüstü (opsiyonel)

```bash
cd frontend/barcode-pos-frontend

# Geliştirme
npm run electron:dev

# Windows kurulum dosyası oluştur
./deploy.ps1             # Backend publish
./deploy-desktop.ps1     # Electron installer
# → electron-dist/ klasöründe Setup .exe
```

## Varsayılan Giriş

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `admin` | `Admin123!` | Admin |

**Site Admin:** `appsettings.json` → `SiteAdmin` bölümünden yapılandırılır.

## Proje Yapısı

```
├── backend/
│   ├── BarcodePos.Domain/          # Entity'ler, Enum'lar
│   ├── BarcodePos.Application/     # DTO'lar, Interface'ler, Validator'lar
│   ├── BarcodePos.Infrastructure/  # EF Core, Service implementasyonları
│   └── BarcodePos.API/             # Controller'lar, Middleware
│
├── frontend/barcode-pos-frontend/
│   ├── src/
│   │   ├── api/           # Axios API client'ları
│   │   ├── components/    # Layout, UI, Public, SiteAdmin
│   │   ├── pages/         # POS, Public, SiteAdmin sayfaları
│   │   ├── store/         # Zustand store'ları
│   │   ├── types/         # TypeScript tip tanımları
│   │   └── utils/         # Yardımcı fonksiyonlar
│   ├── electron.cjs       # Electron ana süreç
│   ├── preload.cjs        # Electron preload
│   └── auto-updater.cjs   # GitHub Releases otomatik güncelleme
│
├── tools/
│   └── LicenseManager/    # Bağımsız lisans yönetim aracı
│
├── deploy.ps1             # Backend + Frontend dağıtım paketi
└── deploy-desktop.ps1     # Electron masaüstü installer
```

## Production Dağıtım

### Otomatik Dağıtım (Önerilen)

```powershell
# 1. Backend publish + frontend build
./deploy.ps1
# → Cari Soft-Setup/ klasörü oluşur

# 2. Masaüstü installer (opsiyonel)
./deploy-desktop.ps1
# → electron-dist/ klasöründe Setup .exe
```

### Ortam Değişkenleri (Production)

| Değişken | Açıklama |
|----------|----------|
| `JwtSettings__Secret` | En az 32 karakter rastgele anahtar |
| `SiteAdmin__Email` | Site admin e-posta |
| `SiteAdmin__Password` | Site admin şifre |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

## Lisans

Bu proje özel kullanım içindir.
