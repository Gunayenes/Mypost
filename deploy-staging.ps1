# ╔══════════════════════════════════════════════════════════════╗
# ║  Cari Soft — STAGING (Test) Deploy Paketi                   ║
# ║  Kullanım: PowerShell'de ./deploy-staging.ps1 çalıştırın    ║
# ║                                                              ║
# ║  Ayrı bir klasöre (CariSoft-Staging) test build çıkarır.    ║
# ║  Plesk'te test.cari-soft.com'a yüklersiniz.                 ║
# ╚══════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot
$OUTPUT = "$ROOT\CariSoft-Staging"
$FRONTEND = "$ROOT\frontend\barcode-pos-frontend"
$BACKEND = "$ROOT\backend\BarcodePos.API"
$WWWROOT = "$BACKEND\wwwroot"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "  Cari Soft STAGING Paketi Olusturuluyor    " -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# ── 1. Staging branch'ine geç ──
Write-Host "[1/6] Staging branch'e geciliyor..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Mevcut branch: $currentBranch" -ForegroundColor Gray
git checkout staging
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Staging branch'e gecilemedi!" -ForegroundColor Red; exit 1 }
git pull origin staging

# ── 2. Temizlik ──
Write-Host "[2/6] Onceki build temizleniyor..." -ForegroundColor Yellow
if (Test-Path $OUTPUT) { Remove-Item $OUTPUT -Recurse -Force }
if (Test-Path "$FRONTEND\dist") { Remove-Item "$FRONTEND\dist" -Recurse -Force }
if (Test-Path $WWWROOT) { Remove-Item $WWWROOT -Recurse -Force }
New-Item -ItemType Directory -Path $WWWROOT -Force | Out-Null

# ── 3. Frontend Build ──
Write-Host "[3/6] Frontend build ediliyor..." -ForegroundColor Yellow
Push-Location $FRONTEND
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Frontend build basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location

# ── 4. Frontend çıktısını backend wwwroot'a kopyala ──
Write-Host "[4/6] Frontend dist wwwroot'a kopyalaniyor..." -ForegroundColor Yellow
Copy-Item "$FRONTEND\dist\*" $WWWROOT -Recurse -Force

# ── 5. Backend Publish ──
Write-Host "[5/6] Backend publish ediliyor (Staging)..." -ForegroundColor Yellow
Push-Location $BACKEND
dotnet publish -c Release -r win-x64 --self-contained true -o "$OUTPUT" `
    -p:PublishSingleFile=false -p:EnvironmentName=Staging
if ($LASTEXITCODE -ne 0) { Write-Host "HATA: Backend publish basarisiz!" -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location

# ── 6. Staging için web.config oluştur ──
Write-Host "[6/6] web.config Staging icin olusturuluyor..." -ForegroundColor Yellow
$webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath=".\BarcodePos.API.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Staging" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
"@
Set-Content -Path "$OUTPUT\web.config" -Value $webConfig -Encoding UTF8

# Main branch'e geri dön
git checkout $currentBranch

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   ✓ STAGING paketi hazir!                              " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Ciktilar: $OUTPUT" -ForegroundColor Cyan
Write-Host ""
Write-Host "Plesk'e yuklerken:" -ForegroundColor White
Write-Host "  - test.cari-soft.com alanina yukleyin" -ForegroundColor Gray
Write-Host "  - ASPNETCORE_ENVIRONMENT=Staging (web.config'te set)" -ForegroundColor Gray
Write-Host ""
