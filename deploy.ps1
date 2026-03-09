# ╔══════════════════════════════════════════════════════════════╗
# ║  KasaPlus — Tek Komutla Dağıtım Paketi Oluşturma          ║
# ║  Kullanım: PowerShell'de ./deploy.ps1 çalıştırın           ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$OUTPUT = "$ROOT\KasaPlus-Setup"
$FRONTEND = "$ROOT\frontend\barcode-pos-frontend"
$BACKEND = "$ROOT\backend\BarcodePos.API"
$WWWROOT = "$BACKEND\wwwroot"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  KasaPlus Dagitim Paketi Olusturuluyor    " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Temizlik ──
Write-Host "[1/5] Onceki build temizleniyor..." -ForegroundColor Yellow
if (Test-Path $OUTPUT) { Remove-Item $OUTPUT -Recurse -Force }
if (Test-Path "$FRONTEND\dist") { Remove-Item "$FRONTEND\dist" -Recurse -Force }
if (Test-Path $WWWROOT) { Remove-Item $WWWROOT -Recurse -Force }
New-Item -ItemType Directory -Path $WWWROOT -Force | Out-Null

# ── 2. Frontend Build ──
Write-Host "[2/5] Frontend build ediliyor..." -ForegroundColor Yellow
Push-Location $FRONTEND
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Frontend build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Frontend build tamamlandi." -ForegroundColor Green

# ── 3. Frontend → Backend wwwroot ──
Write-Host "[3/5] Frontend dosyalari backend'e kopyalaniyor..." -ForegroundColor Yellow
Copy-Item -Path "$FRONTEND\dist\*" -Destination $WWWROOT -Recurse -Force
Write-Host "  Kopyalama tamamlandi." -ForegroundColor Green

# ── 4. Backend Publish ──
Write-Host "[4/5] Backend publish ediliyor (self-contained)..." -ForegroundColor Yellow
Push-Location $BACKEND
dotnet publish -c Release -r win-x64 --self-contained true -o $OUTPUT -p:PublishSingleFile=false
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Backend publish basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Backend publish tamamlandi." -ForegroundColor Green

# ── 5. Başlatma scriptleri oluştur ──
Write-Host "[5/5] Baslat scripti olusturuluyor..." -ForegroundColor Yellow

# KasaPlus.bat — çift tıkla başlat
@"
@echo off
title KasaPlus - Akilli Satis Noktasi
echo.
echo ========================================
echo   KasaPlus baslatiliyor...
echo   Kapatmak icin bu pencereyi kapatin.
echo ========================================
echo.

set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://localhost:5050

echo Veritabani kontrol ediliyor...
BarcodePos.API.exe --migrate 2>nul

echo.
echo Uygulama baslatildi!
echo Tarayicinizda acin: http://localhost:5050
echo.

start http://localhost:5050
BarcodePos.API.exe
"@ | Out-File -FilePath "$OUTPUT\KasaPlus.bat" -Encoding ascii

# Kur.bat — ilk kurulum
@"
@echo off
title KasaPlus - Ilk Kurulum
echo.
echo ==========================================
echo   KasaPlus Ilk Kurulum
echo ==========================================
echo.
echo Veritabani olusturuluyor...
echo.

set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://localhost:5050

BarcodePos.API.exe --migrate 2>nul

echo.
echo ==========================================
echo   Kurulum tamamlandi!
echo.
echo   Lisans aktivasyonu gereklidir.
echo   Baslatmak icin KasaPlus.bat calistiriniz.
echo ==========================================
echo.
pause
"@ | Out-File -FilePath "$OUTPUT\Kur.bat" -Encoding ascii

# KURULUM.txt
@"
============================================
  KasaPlus - Kurulum Kilavuzu
============================================

GEREKSINIMLER:
  - Windows 10/11 (64-bit)
  - Ek kurulum gerektirmez (SQLite + self-contained)

KURULUM ADIMLARI:

  1. Bu klasoru PC'ye kopyalayin
     Ornek: C:\KasaPlus\

  2. "Kur.bat" dosyasini YONETICI OLARAK calistirin
     (Sag tikla > Yonetici olarak calistir)

  3. Kurulum tamamlaninca "KasaPlus.bat" ile baslatabilirsiniz

  4. Tarayicida otomatik acilir: http://localhost:5050

  5. Lisans aktivasyonu icin gelistiriciyle iletisime gecin

SORUN GIDERME:
  - Port 5050 baska uygulama tarafindan kullaniliyor mu?
  - Guvenlik duvari 5050 portunu engelliyor mu?

DESTEK:
  WhatsApp: 0542 746 0197
============================================
"@ | Out-File -FilePath "$OUTPUT\KURULUM.txt" -Encoding ascii

# Tamamlandı
$size = [math]::Round((Get-ChildItem $OUTPUT -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  DAGITIM PAKETI HAZIR!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Konum : $OUTPUT" -ForegroundColor White
Write-Host "  Boyut : $size MB" -ForegroundColor White
Write-Host ""
Write-Host "  Icindekiler:" -ForegroundColor Gray
Write-Host "    BarcodePos.bat  - Uygulamayi baslatir" -ForegroundColor Gray
Write-Host "    Kur.bat         - Ilk kurulum (veritabani)" -ForegroundColor Gray
Write-Host "    KURULUM.txt     - Kurulum kilavuzu" -ForegroundColor Gray
Write-Host ""
Write-Host "  Bu klasoru USB'ye kopyalayip hedef PC'ye tasiyin." -ForegroundColor Yellow
Write-Host ""
