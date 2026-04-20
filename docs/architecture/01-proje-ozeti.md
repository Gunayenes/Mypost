# 📋 Barkodlu Satış ve Stok Takip Yazılımı — Proje Özeti

> **Proje:** Barkod tabanlı satış ve envanter yönetim sistemi  
> **Durum:** Planlama tamamlandı, geliştirme başlamadı

---

## 🎯 Proje Amacı

Perakende mağazalar için barkod okuyucu destekli, offline çalışabilen, veresiye takipli satış ve stok yönetim sistemi geliştirmek.

**ÖNEMLİ:** Harici POS terminal / ödeme cihazı entegrasyonu **YAPILMAYACAK**. Ödeme tipi manuel seçilecek.

---

## ✅ Alınan Kritik Kararlar

| # | Konu | Karar | Detay |
|---|------|-------|-------|
| 1 | **Platform** | Hibrit | React (web) + ASP.NET Core API + Electron (masaüstü) |
| 2 | **Çoklu Mağaza** | Tek mağaza (v1) | DB'de `StoreId` ile gelecek desteğe hazır |
| 3 | **Veritabanı** | SQL Server | .NET uyumu, kurumsal güvenilirlik |
| 4 | **Barkod Okuyucu** | USB (v1) | Klavye emülasyonu, kamera desteği sonra |
| 5 | **Stok Yönetimi** | Miktar takibi | Giriş/çıkış hareketi + minimum stok uyarısı. Lot/SKT yok (v1) |
| 6 | **Kullanıcı Rolleri** | 3 rol | Admin (tam), Yönetici (ürün/stok/rapor), Kasiyer (satış) |
| 7 | **Raporlama** | Kapsamlı | Günlük/haftalık/aylık satış, kâr/zarar, Excel export |
| 8 | **Ödeme Tipleri** | Nakit + Kart + Veresiye | POS terminal entegrasyonu **YOK**, manuel seçim |
| 9 | **Müşteri Yönetimi** | Anonim + Cari hesap | Veresiye/borç takibi var, sadakat sistemi yok (v1) |
| 10 | **Offline Çalışma** | Temel offline | Satış + stok offline çalışır, gelişmiş sync sonra |

---

## 🏗️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS + Zustand + React Router |
| Desktop | Electron |
| Backend | ASP.NET Core Web API (.NET 10) + EF Core |
| Auth | JWT Bearer Token + BCrypt |
| Database | SQL Server 2022 |
| Offline | IndexedDB (Dexie.js) |
| Excel Export | ClosedXML |
| Container | Docker + Docker Compose |
| Test | xUnit + FluentAssertions + Testcontainers |

---

## 📂 Doküman Haritası

| Dosya | İçerik |
|-------|--------|
| [01-proje-ozeti.md](./01-proje-ozeti.md) | Bu dosya — genel özet ve kararlar |
| [02-sistem-mimarisi.md](./02-sistem-mimarisi.md) | Sistem mimarisi, diyagramlar, klasör yapısı |
| [03-veritabani-tasarimi.md](./03-veritabani-tasarimi.md) | ER diyagramı, tablo tanımları, entity sınıfları |
| [04-api-tasarimi.md](./04-api-tasarimi.md) | Tüm API endpoint'leri ve yetki matrisi |
| [05-satis-akisi.md](./05-satis-akisi.md) | POS satış ekranı akışı, barkod okuma mantığı |
| [06-admin-panel.md](./06-admin-panel.md) | Admin dashboard modülleri ve UI sayfaları |
| [07-gelistirme-yol-haritasi.md](./07-gelistirme-yol-haritasi.md) | Sprint bazlı geliştirme planı |
