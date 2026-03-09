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
