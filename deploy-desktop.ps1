# ╔══════════════════════════════════════════════════════════════╗
# ║  Cari Soft — Masaüstü Uygulaması (Electron) Oluşturma      ║
# ║  Kullanım: PowerShell'de ./deploy-desktop.ps1 çalıştırın   ║
# ║  Önce deploy.ps1 çalıştırılmalıdır!                        ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$OUTPUT = "$ROOT\Cari Soft-Setup"
$FRONTEND = "$ROOT\frontend\barcode-pos-frontend"

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Cari Soft Masaustu Uygulamasi Olusturuluyor  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Backend publish hazır mı? ──
if (-not (Test-Path "$OUTPUT\BarcodePos.API.exe")) {
    Write-Host "HATA: Once deploy.ps1 calistirilmalidir!" -ForegroundColor Red
    Write-Host "  -> .\deploy.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "[1/5] Backend paketi bulundu." -ForegroundColor Green

# ── 2. Bağımlılık kontrolü ──
Write-Host "[2/5] Node bagimliliklari kontrol ediliyor..." -ForegroundColor Yellow
Push-Location $FRONTEND
if (-not (Test-Path "node_modules")) {
    Write-Host "  npm install yapiliyor..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "HATA: npm install basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
}
Pop-Location
Write-Host "  Bagimliliklar hazir." -ForegroundColor Green

# ── 3. Frontend build ──
Write-Host "[3/5] Frontend build ediliyor..." -ForegroundColor Yellow
Push-Location $FRONTEND
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Frontend build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Frontend build tamamlandi." -ForegroundColor Green

# ── 4. Eski electron-dist temizle ──
Write-Host "[4/5] Onceki electron build temizleniyor..." -ForegroundColor Yellow
$electronDist = "$FRONTEND\electron-dist"
if (Test-Path $electronDist) { Remove-Item $electronDist -Recurse -Force }
Write-Host "  Temizlik tamamlandi." -ForegroundColor Green

# ── 5. Electron build ──
Write-Host "[5/5] Electron masaustu uygulamasi olusturuluyor..." -ForegroundColor Yellow
Write-Host "  (Bu islem birkac dakika surebilir...)" -ForegroundColor Gray
Push-Location $FRONTEND
npx electron-builder --win --config electron-builder.json
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Electron build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "  Electron build tamamlandi." -ForegroundColor Green

# ── Sonuç ──
$installer = Get-ChildItem "$electronDist\*.exe" -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "*Setup*" -or $_.Name -like "*Install*" } | Select-Object -First 1

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  MASAUSTU UYGULAMASI HAZIR!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Konum: $electronDist" -ForegroundColor White
if ($installer) {
    $sizeMB = [math]::Round($installer.Length / 1MB, 1)
    Write-Host "  Installer: $($installer.Name) ($sizeMB MB)" -ForegroundColor White
}
Write-Host ""
Write-Host "  Kurulum: Installer'i cift tikla, 'Kur' de." -ForegroundColor Yellow
Write-Host "  Calistirma: Masaustundeki 'Cari Soft' ikonuna tikla." -ForegroundColor Yellow
Write-Host ""
Write-Host "  NOT: Ek kurulum gerektirmez (SQLite + self-contained)." -ForegroundColor Gray
Write-Host ""
