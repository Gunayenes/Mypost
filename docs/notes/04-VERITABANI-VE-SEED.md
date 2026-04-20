# BarcodePos — Veritabanı ve Seed Data

## Seed Data (Başlangıç Verileri)

Uygulama ilk çalıştığında otomatik olarak aşağıdaki veriler oluşturulur.

### Varsayılan Kullanıcı
| Kullanıcı Adı | Şifre | Rol |
|----------------|-------|-----|
| `admin` | `Admin123!` | Admin |

### Kategoriler (5 adet)
| ID | Ad |
|----|------|
| 1 | İçecekler |
| 2 | Atıştırmalıklar |
| 3 | Temel Gıda |
| 4 | Temizlik |
| 5 | Kırtasiye |

### Ürünler (20 adet)
| Barkod | Ürün | Kategori | Alış | Satış | KDV | Stok |
|--------|------|----------|------|-------|-----|------|
| 8690504550013 | Çaykur Rize Çay 1kg | İçecekler | 85.00 | 119.90 | %10 | 40 |
| 8690504552017 | Çaykur Filiz Çay 500g | İçecekler | 52.00 | 72.90 | %10 | 35 |
| 8690632017013 | Nescafe Classic 200g | İçecekler | 95.00 | 134.90 | %10 | 25 |
| 8690504050537 | Lipton Yellow Label 100'lü | İçecekler | 38.00 | 54.90 | %10 | 50 |
| 8690637000515 | Eti Tutku 280g | Atıştırmalıklar | 12.00 | 18.90 | %10 | 80 |
| 8690637076411 | Eti Cin 114g | Atıştırmalıklar | 8.50 | 13.90 | %10 | 60 |
| 8690637244131 | Eti Browni Intense | Atıştırmalıklar | 5.00 | 8.90 | %10 | 100 |
| 80135876 | Ülker Çikolatalı Gofret | Atıştırmalıklar | 4.50 | 7.50 | %10 | 120 |
| 8690637957505 | Eti Form Kek | Atıştırmalıklar | 9.00 | 14.50 | %10 | 45 |
| 8691216010017 | Banvit Tavuk Göğüs 800g | Temel Gıda | 75.00 | 99.90 | %1 | 15 |
| 8690504162551 | Sana Margarin 250g | Temel Gıda | 22.00 | 32.90 | %10 | 30 |
| 8690504069508 | Pınar Süt 1L | Temel Gıda | 18.00 | 26.90 | %1 | 50 |
| 8690504155515 | Pınar Beyaz Peynir 600g | Temel Gıda | 55.00 | 74.90 | %10 | 20 |
| 8690504585510 | Pınar Tereyağı 250g | Temel Gıda | 48.00 | 64.90 | %10 | 25 |
| 8690506474058 | ABC Deterjan 4kg | Temizlik | 85.00 | 119.90 | %20 | 15 |
| 8690506192181 | Yumoş 1440ml | Temizlik | 42.00 | 59.90 | %20 | 20 |
| 8690506508012 | Domestos 750ml | Temizlik | 28.00 | 39.90 | %20 | 30 |
| 8690637789014 | Fairy Sıvı 650ml | Temizlik | 32.00 | 44.90 | %20 | 25 |
| 8690506333013 | Faber-Castell 12'li Kurşun Kalem | Kırtasiye | 25.00 | 39.90 | %10 | 40 |
| 8690506222019 | Kores Silgi | Kırtasiye | 3.50 | 6.90 | %10 | 75 |

### Varsayılan Mağaza
| Alan | Değer |
|------|-------|
| Ad | Ana Mağaza |
| Adres | Merkez |
| Telefon | 0212 000 0000 |

## Veritabanı Bağlantı Ayarları

### Development (appsettings.Development.json)
```
Server=localhost,1433;Database=BarcodePosDb;User Id=sa;Password=BarcodePos_Dev2025!
```

### Production (appsettings.Production.json)
```
Server=localhost\SQLEXPRESS;Database=BarcodePosDb;Trusted_Connection=True
```

## Migration

```bash
# Yeni migration oluştur
dotnet ef migrations add MigrationName --project ../BarcodePos.Infrastructure

# Veritabanını güncelle
dotnet ef database update --project ../BarcodePos.Infrastructure

# Production'da otomatik (Program.cs)
BarcodePos.API.exe --migrate
```

## KDV Oranları

Backend validation: `TaxRate` 0-100 arası (yüzde olarak)

| Oran | Kullanım |
|------|----------|
| %1 | Temel gıda (süt, ekmek, tavuk) |
| %10 | Genel gıda, kırtasiye |
| %20 | Temizlik malzemeleri, kozmetik |
