# BarcodePos — Geliştirme Ortamı

## Gereksinimler (Geliştirici)
- .NET 10 SDK
- Node.js 20+
- SQL Server (Docker veya Express)
- Git

## İlk Kurulum

```bash
# Repo'yu klonla
git clone https://github.com/Gunayenes/Mypost.git
cd Mypost

# SQL Server (Docker ile)
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=BarcodePos_Dev2025!" \
  -p 1433:1433 --name barcodepos-db -d mcr.microsoft.com/mssql/server:2022-latest

# Backend
cd backend/BarcodePos.API
dotnet ef database update --project ../BarcodePos.Infrastructure
dotnet run
# → http://localhost:5050 (API)
# → http://localhost:5050/swagger (Swagger UI)

# Frontend (ayrı terminal)
cd frontend/barcode-pos-frontend
npm install
npm run dev
# → http://localhost:5173
```

## Geliştirme Komutları

### Backend
```bash
# Çalıştır
dotnet run

# Build
dotnet build

# Yeni migration
dotnet ef migrations add MigrationName --project ../BarcodePos.Infrastructure

# Veritabanını güncelle
dotnet ef database update --project ../BarcodePos.Infrastructure
```

### Frontend
```bash
# Dev server
npm run dev

# TypeScript kontrolü
npx tsc -b

# Production build
npm run build

# Electron geliştirme modu
npm run electron:dev

# Electron masaüstü installer
npm run electron:build
```

### Dağıtım
```bash
# Web dağıtımı (BarcodePos-Setup/ klasörü oluşturur)
powershell ./deploy.ps1

# Electron masaüstü (BarcodePos Setup 1.0.0.exe oluşturur)
powershell ./deploy-desktop.ps1
```

## Proje Yapılandırma Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `backend/BarcodePos.API/appsettings.json` | Genel ayarlar |
| `backend/BarcodePos.API/appsettings.Development.json` | Dev ortamı |
| `backend/BarcodePos.API/appsettings.Production.json` | Production ortamı |
| `frontend/.env` | Varsayılan env |
| `frontend/.env.development` | Dev API URL |
| `frontend/.env.production` | Production API URL |
| `frontend/vite.config.ts` | Vite + Tailwind + proxy |
| `frontend/electron.cjs` | Electron ana süreç |
| `frontend/electron-builder.json` | Electron paketleme |

## Vite Proxy (Development)

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5050',
      changeOrigin: true,
    },
  },
}
```

## Git Repository

- **URL:** https://github.com/Gunayenes/Mypost
- **Branch:** main
- **Yapı:** Monorepo (backend + frontend tek repo)
