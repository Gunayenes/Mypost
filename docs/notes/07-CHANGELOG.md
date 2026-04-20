# BarcodePos — Yapılan Tüm Çalışmalar (Changelog)

## Proje Oluşturma
- [x] .NET 10 Clean Architecture backend oluşturuldu (Domain, Application, Infrastructure, API)
- [x] React 19 + TypeScript + Vite frontend oluşturuldu
- [x] SQL Server veritabanı tasarımı ve EF Core migration'ları
- [x] 20 gerçek Türk markası ürün ile seed data

## Backend — API Geliştirme
- [x] Auth Controller — JWT login, şifre değiştirme
- [x] Products Controller — CRUD, barkod sorgu, arama, düşük stok
- [x] Categories Controller — CRUD
- [x] Sales Controller — Satış oluşturma, iptal, iade
- [x] Stock Movements Controller — Manuel giriş/çıkış/düzeltme
- [x] Customers Controller — CRUD, bakiye
- [x] Users Controller — CRUD, aktif/pasif toggle
- [x] Dashboard Controller — Günlük özet, haftalık trend
- [x] Reports Controller — Tarih aralığı rapor, Excel export
- [x] FluentValidation — Tüm request'ler için doğrulama
- [x] Global Exception Middleware — Merkezi hata yönetimi
- [x] Serilog — Dosya + konsol loglama
- [x] Health Check endpoint

## Frontend — Sayfa Geliştirme
- [x] Login sayfası — JWT auth, token persist
- [x] Dashboard — Satış özeti, haftalık grafik, düşük stok
- [x] POS Satış — Barkod okutma, sepet, ödeme, kısayollar (F8/F9/F10)
- [x] Ürünler listesi — Arama, filtre, istatistik kartları
- [x] Ürün Ekle/Düzenle — Barkod ile getir, tab yapısı, kâr oranı hesaplama
- [x] Kategoriler — CRUD modal
- [x] Müşteriler — CRUD, sayfalama
- [x] Satışlar — Liste + detay modal + iptal/iade butonları
- [x] Stok Hareketleri — Liste + manuel form
- [x] Raporlar — Tarih aralığı + Excel export
- [x] Kullanıcılar — CRUD + rol + aktif/pasif

## Frontend — UI Bileşenleri
- [x] AppLayout — Sidebar + topbar
- [x] Sidebar — 9 menü, collapse özelliği
- [x] ToastContainer — Global bildirim (success/error/info), slide-in animasyon
- [x] ConfirmModal — Profesyonel onay dialog'u (silme, iptal, iade)

## İyileştirmeler
- [x] Token expire kontrolü — İstek öncesi JWT expire check + 401 toast
- [x] POS müşteri seçimi butonu kaldırıldı (kullanılmıyordu)
- [x] Satış iptal/iade butonları eklendi
- [x] confirm() → ConfirmModal değiştirildi
- [x] Toast bildirim sistemi eklendi
- [x] KDV validation düzeltildi (0-1 → 0-100 arası)
- [x] UTF-8 encoding sorunu düzeltildi (Türkçe karakterler)

## Production Hazırlığı
- [x] appsettings.Production.json — Production config
- [x] Config-driven CORS — AllowedOrigins ayardan okunuyor
- [x] Environment variables — .env, .env.development, .env.production
- [x] API URL config-driven — import.meta.env.VITE_API_BASE_URL
- [x] Static file serving — Backend üzerinden frontend serve
- [x] SPA fallback — React Router desteği (MapFallbackToFile)
- [x] Otomatik migration — --migrate argümanı + Production auto-migrate
- [x] HTTPS redirect — Sadece dev ortamında aktif

## Dağıtım
- [x] deploy.ps1 — Web dağıtım scripti (self-contained publish)
- [x] deploy-desktop.ps1 — Electron masaüstü dağıtım scripti
- [x] BarcodePos.bat — Çift tıkla başlat + tarayıcı aç
- [x] Kur.bat — İlk kurulum (veritabanı oluştur)
- [x] KURULUM.txt — Türkçe kurulum kılavuzu

## Electron Masaüstü
- [x] electron.cjs — Backend'i child process olarak başlat
- [x] Splash screen — "Sistem başlatılıyor..." yükleme ekranı
- [x] Health check beklemesi — Backend hazır olana kadar bekle
- [x] Otomatik backend durdurma — Pencere kapatılınca backend de kapanır
- [x] electron-builder.json — NSIS installer, masaüstü kısayolu
- [x] BarcodePos Setup 1.0.0.exe — 140.6 MB tek dosya installer

## Dokümantasyon
- [x] README.md — Ana proje dokümantasyonu
- [x] docs/01-MIMARI.md — Proje mimarisi
- [x] docs/02-API-ENDPOINTLER.md — API endpointleri
- [x] docs/03-FRONTEND-SAYFALARI.md — Sayfalar ve bileşenler
- [x] docs/04-VERITABANI-VE-SEED.md — DB şeması ve seed data
- [x] docs/05-DAGITIM-VE-KURULUM.md — Dağıtım ve kurulum
- [x] docs/06-GELISTIRME-ORTAMI.md — Geliştirme ortamı
- [x] docs/07-CHANGELOG.md — Yapılan tüm çalışmalar
