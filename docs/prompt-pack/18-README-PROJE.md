# 📝 FAZ 6-B: Proje README.md

> Bu dosya projenin kök dizinindeki README.md dosyasını üretmek içindir.

---

```plaintext
Generate a professional README.md for the BarcodePos project.

Write it in Turkish, but keep technical terms in their standard English/international form.

═══════════════════════════════════════
README STRUCTURE
═══════════════════════════════════════

# 🏪 BarcodePos — Barkodlu Satış ve Stok Takip Sistemi

## 📋 Proje Hakkında
- What is this project
- Target users (small/medium retail stores)
- Key features summary

## ✨ Özellikler
- Barkod okuyucu ile hızlı satış
- Nakit, Kart, Veresiye ödeme desteği
- Gerçek zamanlı stok takibi
- Müşteri veresiye/bakiye yönetimi
- Kapsamlı raporlama (günlük, dönemsel, kâr/zarar)
- Excel export
- Rol bazlı yetkilendirme (Admin, Yönetici, Kasiyer)
- Temel offline destek
- Masaüstü uygulama (Electron)

## 🏗️ Mimari
- Clean Architecture diagram (text-based)
- Dependency flow explanation
- Technology stack table

## 🛠️ Teknoloji Stack
Table with:
- Backend: ASP.NET Core Web API (.NET 10), EF Core, FluentValidation, Mapster, BCrypt, ClosedXML, Serilog
- Frontend: React 18, TypeScript, Tailwind CSS, Zustand, React Router, Axios, Dexie.js
- Desktop: Electron
- Database: SQL Server 2022
- Testing: xUnit, FluentAssertions, Testcontainers
- Container: Docker, Docker Compose

## 📂 Proje Yapısı
- Show folder tree (simplified)

## 🚀 Kurulum

### Gereksinimler
- .NET 10 SDK
- Node.js 18+
- Docker & Docker Compose
- SQL Server 2022 (or Docker image)

### Backend Kurulumu
```bash
cd src/backend
dotnet restore
dotnet ef database update --project src/BarcodePos.Infrastructure --startup-project src/BarcodePos.API
dotnet run --project src/BarcodePos.API
```

### Frontend Kurulumu
```bash
cd src/frontend
npm install
npm run dev
```

### Docker ile Çalıştırma
```bash
docker-compose up -d
```

## 🔑 Varsayılan Giriş Bilgileri
- Kullanıcı: admin
- Şifre: Admin123!
- ⚠️ Bu bilgileri production'da mutlaka değiştirin!

## 📡 API Dokümantasyonu
- Swagger URL: http://localhost:5000/swagger
- List key endpoint groups briefly

## 🔫 Barkod Okuyucu
- How USB scanner works (keyboard emulation)
- Supported scanner types
- How to test without physical scanner

## 📊 Raporlar
- Available report types
- Excel export

## 🗺️ Yol Haritası
- [x] v1.0 — Temel satış, stok, müşteri yönetimi
- [ ] v1.1 — Gelişmiş offline sync
- [ ] v1.2 — Kamera barkod tarama
- [ ] v2.0 — Çoklu mağaza desteği
- [ ] v2.1 — Sadakat programı

## 📸 Ekran Görüntüleri
- Placeholder sections:
  - POS Satış Ekranı
  - Admin Dashboard
  - Ürün Yönetimi
  - Raporlar

## 🤝 Katkıda Bulunma
- Brief contribution guidelines

## 📄 Lisans
- MIT License placeholder

Output: Complete README.md content
```
