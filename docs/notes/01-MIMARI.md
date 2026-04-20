# BarcodePos — Proje Mimarisi

## Genel Bakış

BarcodePos, küçük ve orta ölçekli işletmeler için geliştirilmiş barkod okuyucu destekli
POS (Point of Sale) sistemidir. Offline çalışır, internet gerektirmez.

## Teknoloji Yığını

### Backend
| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| .NET | 10 | Runtime |
| ASP.NET Core | 10 | Web API |
| Entity Framework Core | 10 | ORM |
| SQL Server | Express | Veritabanı |
| FluentValidation | — | İstek doğrulama |
| Serilog | — | Yapılandırılmış loglama |
| JWT Bearer | — | Kimlik doğrulama |

### Frontend
| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Tip güvenliği |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Stil |
| Zustand | 5 | State management |
| Axios | — | HTTP client |
| Lucide React | — | İkonlar |
| Electron | 40 | Masaüstü uygulama |

## Mimari: Clean Architecture

```
┌─────────────────────────────────────────────────┐
│                  BarcodePos.API                  │
│        Controllers, Middleware, Program.cs       │
├─────────────────────────────────────────────────┤
│              BarcodePos.Application              │
│         DTOs, Interfaces, Validators             │
├─────────────────────────────────────────────────┤
│             BarcodePos.Infrastructure            │
│    EF Core DbContext, Services, Migrations       │
├─────────────────────────────────────────────────┤
│                BarcodePos.Domain                 │
│           Entities, Enums, Common                │
└─────────────────────────────────────────────────┘
```

## Proje Yapısı

```
MyPost/
├── backend/
│   ├── BarcodePos.Domain/
│   │   ├── Common/              → BaseEntity
│   │   ├── Entities/            → Product, Sale, Category, Customer, ...
│   │   └── Enums/               → PaymentType, SaleStatus, MovementType, UserRole
│   │
│   ├── BarcodePos.Application/
│   │   ├── Common/              → Result<T>, PagedResult<T>
│   │   ├── DTOs/                → Request/Response DTO'ları
│   │   ├── Interfaces/          → IProductService, ISaleService, ...
│   │   └── Validators/          → FluentValidation kuralları
│   │
│   ├── BarcodePos.Infrastructure/
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/  → EF Core entity konfigürasyonları + Seed data
│   │   │   └── Migrations/
│   │   └── Services/            → ProductService, SaleService, ...
│   │
│   └── BarcodePos.API/
│       ├── Controllers/         → 10 controller
│       ├── Middleware/           → GlobalExceptionMiddleware
│       ├── Program.cs           → Uygulama başlatma, DI, pipeline
│       └── wwwroot/             → Production'da frontend dosyaları
│
├── frontend/barcode-pos-frontend/
│   ├── src/
│   │   ├── api/                 → Axios API client'ları (9 dosya)
│   │   ├── components/
│   │   │   ├── layout/          → AppLayout, Sidebar
│   │   │   └── ui/              → ToastContainer, ConfirmModal
│   │   ├── pages/               → 11 sayfa bileşeni
│   │   ├── store/               → authStore, cartStore
│   │   └── types/               → TypeScript tip tanımları
│   ├── electron.cjs             → Electron ana süreç
│   └── electron-builder.json    → Electron paketleme config
│
├── docs/                        → Proje dokümantasyonu
├── deploy.ps1                   → Web dağıtım scripti
├── deploy-desktop.ps1           → Electron masaüstü dağıtım scripti
└── README.md                    → Ana dokümantasyon
```

## Veritabanı Şeması

```
Stores ──┬── Products ──── SaleItems
         │       │
         │       └── StockMovements
         │
         ├── Categories ── Products
         │
         ├── Users ────┬── Sales ──── SaleItems
         │             │
         │             └── StockMovements
         │
         ├── Customers ─── CustomerTransactions
         │       │
         │       └── Sales
         │
         └── Sales ──── CustomerTransactions
```

## Entity'ler

| Entity | Tablo | Açıklama |
|--------|-------|----------|
| Store | Stores | Mağaza bilgileri |
| User | Users | Kullanıcılar (Admin/Yönetici/Kasiyer) |
| Category | Categories | Ürün kategorileri |
| Product | Products | Ürünler (barkod, fiyat, stok) |
| Sale | Sales | Satış işlemleri |
| SaleItem | SaleItems | Satış kalemleri (fiyat snapshot) |
| StockMovement | StockMovements | Stok hareketleri |
| Customer | Customers | Müşteriler |
| CustomerTransaction | CustomerTransactions | Müşteri veresiye hareketleri |
