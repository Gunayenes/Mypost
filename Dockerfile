# ╔══════════════════════════════════════════════════════════════╗
# ║  KasaPlus — Multi-stage Docker Build                       ║
# ║  Frontend (React) + Backend (.NET 10) → Tek Container      ║
# ╚══════════════════════════════════════════════════════════════╝

# ── Stage 1: Frontend Build ──
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/barcode-pos-frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/barcode-pos-frontend/ ./
RUN npm run build

# ── Stage 2: Backend Build ──
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
COPY backend/Directory.Build.props ./
COPY backend/BarcodePos.Domain/BarcodePos.Domain.csproj BarcodePos.Domain/
COPY backend/BarcodePos.Application/BarcodePos.Application.csproj BarcodePos.Application/
COPY backend/BarcodePos.Infrastructure/BarcodePos.Infrastructure.csproj BarcodePos.Infrastructure/
COPY backend/BarcodePos.API/BarcodePos.API.csproj BarcodePos.API/
RUN dotnet restore BarcodePos.API/BarcodePos.API.csproj
COPY backend/ ./
RUN dotnet publish BarcodePos.API/BarcodePos.API.csproj -c Release -o /app/publish --no-restore

# ── Stage 3: Runtime ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# SQLite (lisans DB) için gerekli native lib
RUN apt-get update && apt-get install -y --no-install-recommends libsqlite3-0 && rm -rf /var/lib/apt/lists/*

# Backend publish çıktısı
COPY --from=backend-build /app/publish ./

# Frontend build → wwwroot
COPY --from=frontend-build /app/frontend/dist ./wwwroot/

# Data klasörü (SQLite DB'ler burada)
RUN mkdir -p /app/data

# Ortam değişkenleri
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ConnectionStrings__LicenseConnection="Data Source=/app/data/licenses.db"
ENV DISABLE_LICENSE_CHECK=true

EXPOSE 10000

ENTRYPOINT ["dotnet", "BarcodePos.API.dll"]
