# ╔══════════════════════════════════════════════════════════════╗
# ║  KasaPlus — Masaüstü Uygulaması (Electron) Oluşturma      ║
# ║  Kullanım: PowerShell'de ./deploy-desktop.ps1 çalıştırın   ║
# ║  Önce deploy.ps1 çalıştırılmalıdır!                        ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$OUTPUT = "$ROOT\KasaPlus-Setup"
$FRONTEND = "$ROOT\frontend\barcode-pos-frontend"

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  KasaPlus Masaustu Uygulamasi Olusturuluyor  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Backend publish hazır mı? ──
if (-not (Test-Path "$OUTPUT\BarcodePos.API.exe") -and -not (Test-Path "$OUTPUT\KasaPlus.API.exe")) {
    Write-Host "HATA: Once deploy.ps1 calistirilmalidir!" -ForegroundColor Red
    Write-Host "  -> .\deploy.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[1/4] Backend paketi bulundu." -ForegroundColor Green

# ── 2. Frontend build ──
Write-Host "[2/4] Frontend build ediliyor..." -ForegroundColor Yellow
Push-Location $FRONTEND
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Frontend build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Frontend build tamamlandi." -ForegroundColor Green

# ── 3. Electron build ──
Write-Host "[3/4] Electron masaustu uygulamasi olusturuluyor..." -ForegroundColor Yellow
Write-Host "  (Bu islem birka dakika surebilir...)" -ForegroundColor Gray
Push-Location $FRONTEND
npx electron-builder --win --config electron-builder.json
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Electron build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Electron build tamamlandi." -ForegroundColor Green

# ── 4. Sonuç ──
$installerDir = "$FRONTEND\electron-dist"
$installer = Get-ChildItem "$installerDir\*.exe" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*Setup*" -or $_.Name -like "*Install*" } | Select-Object -First 1

Write-Host ""
Write-Host "[4/4] Tamamlandi!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  MASAUSTU UYGULAMASI HAZIR!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Konum: $installerDir" -ForegroundColor White
if ($installer) {
    $sizeMB = [math]::Round($installer.Length / 1MB, 1)
    Write-Host "  Installer: $($installer.Name) ($sizeMB MB)" -ForegroundColor White
}
Write-Host ""
Write-Host "  Kurulum: Installer'i cift tikla, 'Kur' de." -ForegroundColor Yellow
Calistirma: Masaustundeki 'KasaPlus' ikonuna tikla.
Write-Host ""
Write-Host "  NOT: Ek kurulum gerektirmez (SQLite + self-contained)." -ForegroundColor Gray
Write-Host ""
