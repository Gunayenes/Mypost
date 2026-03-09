# BarcodePos — Yapılacaklar Listesi (TODO)

## ✅ Tamamlananlar

### Temel Sistem
- [x] Clean Architecture backend (.NET 10)
- [x] React 19 + TypeScript frontend
- [x] JWT kimlik doğrulama (Admin/Yönetici/Kasiyer)
- [x] POS satış ekranı (barkod okuyucu, sepet, ödeme, kısayollar)
- [x] Ürün yönetimi (CRUD, barkod, kategori, stok, KDV)
- [x] Kategori yönetimi
- [x] Müşteri yönetimi
- [x] Stok hareketleri (giriş/çıkış/düzeltme)
- [x] Satış takibi (iptal, iade)
- [x] Raporlar (tarih aralığı, Excel export)
- [x] Dashboard (günlük özet, haftalık trend, düşük stok)
- [x] Kullanıcı yönetimi (rol, aktif/pasif)
- [x] Toast bildirim sistemi
- [x] Onay modal'ları (silme, iptal, iade)

### Dağıtım
- [x] SQLite veritabanı (SQL Server'a gerek yok)
- [x] Self-contained publish (bakkalda .NET kurulumu gereksiz)
- [x] Electron masaüstü uygulaması (BarcodePos Setup 1.0.0.exe)
- [x] deploy.ps1 — web dağıtım scripti
- [x] deploy-desktop.ps1 — Electron dağıtım scripti

### Lisans Sistemi
- [x] Donanıma kilitli lisans (Makine ID)
- [x] Süreli lisans (30/90/180/365/730/3650 gün)
- [x] HMAC-SHA256 imzalı lisans anahtarı
- [x] Müşteriye özel kullanıcı adı/şifre (lisans içinde gömülü)
- [x] Lisans aktivasyonunda otomatik kullanıcı oluşturma
- [x] Lisans Yönetim Paneli (LicenseManager — masaüstü uygulaması)
- [x] Lisans üretme, yenileme, pasife alma, silme

### Dokümantasyon
- [x] README.md
- [x] docs/ klasörü (7 dosya — mimari, API, frontend, DB, dağıtım, geliştirme, changelog)

---

## 📋 Yapılacaklar

### Öncelik 1 — Bakkal İçin Kritik
- [ ] ~~🧾 **Fiş Yazdırma** — POS satış sonrası termal yazıcıdan fiş çıktısı~~ *(v1'de yapılmayacak)*
- [x] 💾 **Veritabanı Yedekleme/Geri Yükleme** — Tek tıkla BarcodePos.db yedekle + geri yükle
- [x] 📊 **Kâr/Zarar Raporu** — Alış/satış fiyatı farkından kâr analizi (günlük, kategori, ürün bazlı)

### Öncelik 2 — Değer Katan
- [x] 📥 **Toplu Ürün İçe Aktarma** — Excel'den toplu ürün yükleme (şablon + hata raporu)
- [x] 💰 **Veresiye Detay Takibi** — Müşteri borç/alacak detaylı takip + ödeme alma
- [x] 📈 **Dashboard Grafikleri** — Haftalık çubuk grafik + ödeme dağılımı pasta grafik

### Öncelik 3 — Profesyonel Dokunuşlar
- [x] 🔄 **Otomatik Güncelleme** — GitHub Releases tabanlı, arka plan indirme, offline sessiz
- [ ] ~~🌍 **Çoklu Dil Desteği** — Türkçe / İngilizce / Kürtçe arayüz~~ *(v1'de yapılmayacak)*
- [x] 📱 **Lisans Paneline SMS/WhatsApp** — WhatsApp ile tek tıkla lisans anahtarı gönderme
- [x] 🌐 **Lisans Paneline Uzaktan Erişim** — Bakkal WhatsApp ile tek tıkla lisans talep eder (Makine ID otomatik)

---

## 📌 Notlar
- Tüm sistem offline çalışır (internet gerektirmez)
- SQLite kullanılır (ayrı veritabanı kurulumu gereksiz)
- Self-contained dağıtım (.NET kurulumu gereksiz)
- GitHub: https://github.com/Gunayenes/Mypost (branch: main)
