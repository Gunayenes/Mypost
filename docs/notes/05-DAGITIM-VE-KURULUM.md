# BarcodePos — Dağıtım ve Kurulum

## Dağıtım Seçenekleri

### Seçenek 1: Web Dağıtımı (Tarayıcı ile kullanım)

Tek klasör, tarayıcıda çalışır.

**Paket oluşturma:**
```powershell
.\deploy.ps1
```

**Çıktı:** `BarcodePos-Setup/` klasörü (~134 MB, self-contained)

**İçerik:**
```
BarcodePos-Setup/
├── BarcodePos.API.exe    ← Ana uygulama
├── BarcodePos.bat        ← Çift tıkla başlat + tarayıcı otomatik açılır
├── Kur.bat               ← İlk kurulum (veritabanı oluşturur)
├── KURULUM.txt           ← Kurulum kılavuzu
├── wwwroot/              ← Frontend dosyaları
├── appsettings.Production.json
└── ... (.NET runtime, DLL'ler)
```

### Seçenek 2: Masaüstü Uygulaması (Electron)

Tek `.exe` installer, masaüstü ikonu ile çalışır.

**Paket oluşturma:**
```powershell
# Önce backend publish
.\deploy.ps1

# Sonra Electron build
.\deploy-desktop.ps1
```

**Çıktı:** `frontend/barcode-pos-frontend/electron-dist/BarcodePos Setup 1.0.0.exe` (~141 MB)

**Electron akışı:**
```
Kullanıcı ikona tıklar
  → Splash screen açılır ("Sistem başlatılıyor...")
  → Backend (BarcodePos.API.exe) otomatik başlar
  → Health check ile hazır olmasını bekler
  → Ana pencere açılır (login sayfası)
  → Pencere kapatılınca backend otomatik durur
```

## Hedef PC Gereksinimleri

| Gereksinim | Detay |
|------------|-------|
| İşletim Sistemi | Windows 10/11 (64-bit) |
| Veritabanı | **SQLite (gömülü — kurulum gerektirmez)** |
| RAM | Minimum 4 GB |
| Disk | 300 MB boş alan |
| İnternet | **Gerekli değil** (tamamen offline çalışır) |
| .NET Runtime | **Gerekli değil** (self-contained) |
| SQL Server | **Gerekli değil** (SQLite kullanılıyor) |
| Tarayıcı | Sadece web dağıtımında gerekli |

## Kurulum Adımları (Bakkalın PC'si)

### Web Dağıtımı
```
1. BarcodePos-Setup klasörünü kopyala
2. BarcodePos.bat → Çift tıkla → Tarayıcı açılır
3. Giriş: admin / Admin123!
```

### Electron Masaüstü
```
1. "BarcodePos Setup 1.0.0.exe" çalıştır → Kur
2. Masaüstündeki "BarcodePos" ikonuna tıkla
3. Giriş: admin / Admin123!
```

## Production Konfigürasyon

### appsettings.Production.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=BarcodePos.db"
  },
  "JwtSettings": {
    "Secret": "...(en az 32 karakter)..."
  },
  "AllowedOrigins": "http://localhost:5050",
  "Kestrel": {
    "Endpoints": {
      "Http": { "Url": "http://localhost:5050" }
    }
  }
}
```

### Ortam Değişkenleri (Alternatif)
```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://localhost:5050
ConnectionStrings__DefaultConnection=...
JwtSettings__Secret=...
```

## Barkod Okuyucu

USB barkod okuyucular klavye emülasyonu yapar — ek kurulum gerektirmez.

```
Okuyucu → Barkodu okur → Klavyeden yazılmış gibi gönderir → ENTER basar
POS → Input'a yazılır → handleBarcodeScan tetiklenir → Ürün sepete eklenir
```

**Uyumlu markalar:** Honeywell, Zebra, Netum (tüm USB HID okuyucular)

## Port ve Firewall

| Port | Kullanım |
|------|----------|
| 5050 | Backend API + Frontend |

Firewall'da 5050 portuna izin vermeye **gerek yok** — uygulama sadece localhost'ta çalışır.
