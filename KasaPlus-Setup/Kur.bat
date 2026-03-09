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
