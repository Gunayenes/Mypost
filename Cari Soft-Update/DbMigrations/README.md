# DbMigrations — Özel Veritabanı Güncelleme Scriptleri

Bu klasöre koyduğun `.sql` dosyaları **uygulama her başladığında** sırayla otomatik çalışır.

## Nasıl Kullanılır?

1. Yeni bir SQL dosyası oluştur (adı sayıyla başlasın, sıralama için):
   ```
   001_garanti_suresi_ekle.sql
   002_kupon_tablosu.sql
   003_musteri_indirimi.sql
   ```

2. İçine SQL yaz:
   ```sql
   ALTER TABLE Products ADD GarantiSuresi INT NULL;
   ```

3. Deploy et — uygulama otomatik çalıştırır

## Kurallar

- **Dosya adı değiştirme!** Uygulandıktan sonra adını değiştirirsen tekrar çalışır
- **Numaralı başla** (`001_`, `002_`) — sıralama alfabetik
- **Idempotent yaz** (zaten varsa hata vermesin):
  ```sql
  IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'GarantiSuresi' AND Object_ID = Object_ID('Products'))
      ALTER TABLE Products ADD GarantiSuresi INT NULL;
  ```

## Provider'a Özel SQL

Dosya adına özel suffix ekleyerek sadece belirli DB'lerde çalışsın:

- `001_ornek.sqlserver.sql` — sadece SQL Server
- `001_ornek.sqlite.sql` — sadece SQLite
- `001_ornek.postgres.sql` — sadece PostgreSQL
- `001_ornek.sql` — hepsinde çalışır

## Takip

Hangisi uygulandı? Uygulama `__CustomMigrations` tablosuna kaydediyor:

```sql
SELECT * FROM __CustomMigrations ORDER BY AppliedAt;
```

## Örnek: Yeni Kolon Ekleme

**001_products_garanti.sqlserver.sql:**
```sql
IF NOT EXISTS (SELECT * FROM sys.columns
               WHERE Name = 'GarantiSuresi'
                 AND Object_ID = Object_ID('Products'))
BEGIN
    ALTER TABLE Products ADD GarantiSuresi INT NULL;
END
```

**001_products_garanti.sqlite.sql:**
```sql
-- SQLite'da column varsa hata verir ama zararsızdır, sadece başarısız olur ve görmezden gelinir.
-- IdempotentScheme için önce sorgu kullan:
ALTER TABLE Products ADD COLUMN GarantiSuresi INTEGER NULL;
```

Deploy et — gerisi otomatik.
