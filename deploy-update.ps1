# ╔══════════════════════════════════════════════════════════════╗
# ║  Cari Soft — Production Guncelleme Paketi                   ║
# ║                                                              ║
# ║  .\deploy-update.ps1 calistirir:                            ║
# ║  1. main branch'i pull et (en son kod)                      ║
# ║  2. Frontend build                                           ║
# ║  3. Backend publish                                          ║
# ║  4. web.config'i KORU (uretimden getirme)                    ║
# ║  5. Guncelleme paketi hazirla                                ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$OUTPUT = "$ROOT\Cari Soft-Update"
$FRONTEND = "$ROOT\frontend\barcode-pos-frontend"
$BACKEND = "$ROOT\backend\BarcodePos.API"
$WWWROOT = "$BACKEND\wwwroot"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  CARI SOFT - GUNCELLEME PAKETI             " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ── Git pull ──
Write-Host "[1/5] Git pull (main branch)..." -ForegroundColor Yellow
git checkout main
git pull origin main
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: git pull basarisiz!" -ForegroundColor Red; exit 1 }

# ── Temizlik ──
Write-Host "[2/5] Onceki paket temizleniyor..." -ForegroundColor Yellow
if (Test-Path $OUTPUT) { Remove-Item $OUTPUT -Recurse -Force }
if (Test-Path "$FRONTEND\dist") { Remove-Item "$FRONTEND\dist" -Recurse -Force }
if (Test-Path $WWWROOT) { Remove-Item $WWWROOT -Recurse -Force }
New-Item -ItemType Directory -Path $WWWROOT -Force | Out-Null

# ── Frontend build ──
Write-Host "[3/5] Frontend build..." -ForegroundColor Yellow
Push-Location $FRONTEND
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Frontend build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Copy-Item "$FRONTEND\dist\*" $WWWROOT -Recurse -Force

# ── Masaüstü installer'ı varsa wwwroot/downloads'a koy (web sitesinde indirilebilsin) ──
$installerSrc = "$FRONTEND\electron-dist\Cari Soft Setup 1.0.0.exe"
if (Test-Path $installerSrc) {
    $downloadsDir = "$WWWROOT\downloads"
    New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
    Copy-Item $installerSrc "$downloadsDir\CariSoft-Setup.exe" -Force
    $instSize = [math]::Round((Get-Item "$downloadsDir\CariSoft-Setup.exe").Length / 1MB, 1)
    Write-Host "  Masaüstü installer eklendi: /downloads/CariSoft-Setup.exe ($instSize MB)" -ForegroundColor Green
} else {
    Write-Host "  (Masaüstü installer bulunamadı - sadece web paketi)" -ForegroundColor Gray
}

# ── Backend publish ──
Write-Host "[4/5] Backend publish..." -ForegroundColor Yellow
Push-Location $BACKEND
dotnet publish -c Release -o $OUTPUT --no-self-contained
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Backend publish basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location

# ── web.config'i SIL (sunucudaki korunsun) ──
Write-Host "[5/5] web.config siliniyor (sunucudaki korunsun)..." -ForegroundColor Yellow
if (Test-Path "$OUTPUT\web.config") {
    Remove-Item "$OUTPUT\web.config" -Force
    Write-Host "  web.config silindi. Sunucudaki web.config'e dokunulmayacak." -ForegroundColor Green
}

# ── Gereksiz App_Data siliniyor (sunucudaki SQL verileri korunsun) ──
if (Test-Path "$OUTPUT\App_Data") {
    Remove-Item "$OUTPUT\App_Data" -Recurse -Force
}

$size = [math]::Round((Get-ChildItem $OUTPUT -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "   GUNCELLEME PAKETI HAZIR!                  " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Konum: $OUTPUT" -ForegroundColor White
Write-Host "  Boyut: $size MB" -ForegroundColor White
Write-Host ""
Write-Host "  DEPLOY ADIMLARI:" -ForegroundColor Cyan
Write-Host "  1. PLESK'te DB yedek al (Databases > Dokumu disari aktar)" -ForegroundColor Gray
Write-Host "  2. FileZilla ile $OUTPUT icerigini httpdocs'a yukle" -ForegroundColor Gray
Write-Host "     - Overwrite: All" -ForegroundColor Gray
Write-Host "     - Skip existing: NO" -ForegroundColor Gray
Write-Host "     - web.config dokunulmaz (silinmis)" -ForegroundColor Gray
Write-Host "     - App_Data dokunulmaz (silinmis)" -ForegroundColor Gray
Write-Host "  3. Plesk > Dotnet > Restart App" -ForegroundColor Gray
Write-Host "  4. cari-soft.com > test et" -ForegroundColor Gray
Write-Host ""
