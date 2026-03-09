# BarcodePos — Barkodlu Satış Noktası Yönetim Sistemi

Küçük ve orta ölçekli işletmeler için geliştirilmiş, barkod okuyucu destekli modern POS (Point of Sale) sistemi.

## Teknolojiler

### Backend
- **.NET 10** — ASP.NET Core Web API
- **Entity Framework Core** — SQL Server
- **JWT Authentication** — Rol tabanlı yetkilendirme (Admin, Yönetici, Kasiyer)
- **FluentValidation** — İstek doğrulama
- **Serilog** — Yapılandırılmış loglama
- **Clean Architecture** — Domain / Application / Infrastructure / API

### Frontend
- **React 19** + **TypeScript**
- **Vite** — Build toolchain
- **Tailwind CSS v4** — Utility-first styling
- **Zustand** — State management
- **Axios** — HTTP client
- **Lucide React** — İkonlar
- **Electron** — Masaüstü uygulama (opsiyonel)

## Özellikler

| Modül | Açıklama |
|-------|----------|
| **POS Satış** | Barkod okutma, hızlı ürün arama, kategori butonları, F8/F9/F10 kısayolları |
| **Ürün Yönetimi** | Barkod ile ekle/düzenle, kategori filtresi, stok takibi, KDV hesaplama |
| **Stok Hareketleri** | Giriş/çıkış/düzeltme, satış & iade otomatik kayıt |
| **Satış Takibi** | Fiş detayı, iptal, iade, ödeme tipi filtreleme |
| **Müşteri Yönetimi** | Müşteri CRUD, veresiye bakiye takibi |
| **Raporlar** | Tarih aralığı satış raporu, günlük kırılım, Excel export |
| **Dashboard** | Bugünkü satış, haftalık trend, düşük stok uyarıları |
| **Kullanıcılar** | Rol tabanlı erişim (Admin/Yönetici/Kasiyer), aktif/pasif yönetimi |

## Kurulum

### Gereksinimler
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [SQL Server](https://www.microsoft.com/sql-server) (veya Docker ile)

### 1. Veritabanı

```bash
# Docker ile SQL Server (opsiyonel)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=BarcodePos_Dev2025!" \
  -p 1433:1433 --name barcodepos-db -d mcr.microsoft.com/mssql/server:2022-latest
```

### 2. Backend

```bash
cd backend/BarcodePos.API

# Veritabanını oluştur
dotnet ef database update --project ../BarcodePos.Infrastructure

# Çalıştır
dotnet run
# → http://localhost:5050
# → Swagger: http://localhost:5050/swagger
```

### 3. Frontend

```bash
cd frontend/barcode-pos-frontend

npm install
npm run dev
# → http://localhost:5173
```

### 4. Electron Masaüstü (opsiyonel)

```bash
# Geliştirme
npm run electron:dev

# Windows kurulum dosyası oluştur
npm run electron:build
# → electron-dist/ klasöründe .exe dosyası
```

## Varsayılan Giriş

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `admin` | `Admin123!` | Admin |

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
│   │   ├── api/          # Axios API client'ları
│   │   ├── components/   # Layout, UI bileşenleri
│   │   ├── pages/        # Sayfa bileşenleri
│   │   ├── store/        # Zustand store'ları
│   │   └── types/        # TypeScript tip tanımları
│   ├── electron.cjs      # Electron ana süreç
│   └── electron-builder.json
```

## Production Dağıtım

### Tek Sunucu (Backend + Frontend)

```bash
# 1. Frontend build
cd frontend/barcode-pos-frontend
npm run build

# 2. Build çıktısını backend wwwroot'a kopyala
cp -r dist/* ../backend/BarcodePos.API/wwwroot/

# 3. Backend publish
cd backend/BarcodePos.API
dotnet publish -c Release -o ./publish

# 4. Çalıştır
cd publish
ASPNETCORE_ENVIRONMENT=Production dotnet BarcodePos.API.dll
```

### Ortam Değişkenleri (Production)

| Değişken | Açıklama |
|----------|----------|
| `ConnectionStrings__DefaultConnection` | SQL Server bağlantı dizesi |
| `JwtSettings__Secret` | En az 32 karakter rastgele anahtar |
| `AllowedOrigins` | Frontend URL (virgülle ayrılmış) |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

## Lisans

Bu proje özel kullanım içindir.
