# Cari Soft — Production Güncelleme Rehberi

Aktif kullanıcılar ve verilerle canlıda çalışırken yeni sürüm nasıl yayınlanır.

## ⚠️ Altın Kurallar

1. **ASLA** production DB'sini silme
2. **ASLA** `httpdocs/App_Data` klasörünü silme (SQLite dosyası oradadır)
3. **HER** güncellemeden önce DB yedeği al
4. **ÖNCE** staging'de dene, sonra production

---

## Güncelleme Türleri

### Tip 1: Sadece Kod Değişikliği (Yeni Migration YOK)
Örnek: UI renk değişikliği, yeni buton, mevcut endpoint'e yeni alan

- DB'ye dokunmadan dosyaları değiştir → Restart App
- **En güvenli, en hızlı güncelleme**

### Tip 2: Yeni Kolon/Tablo (Migration VAR)
Örnek: Yeni özellik için DB'ye alan eklendi

- Önce DB yedeği al
- SQL ile değişiklikleri uygula
- Sonra yeni dosyaları yükle
- Restart App

### Tip 3: Breaking Change (Eski Veriyle Uyumsuz)
Nadir durumlar — genelde kaçınılır.

---

## Standart Güncelleme Akışı (Tip 1 ve 2)

### ADIM 1: Yerelde Geliştir (Staging Branch'te)

```bash
git checkout staging
git pull origin staging

# Kod değişikliğini yap
# ...

# Commit ve push
git add .
git commit -m "feat: yeni özellik açıklaması"
git push origin staging
```

### ADIM 2: Test Ortamında Dene

Eğer **test.cari-soft.com** setup'ın varsa:

```bash
# Test ortamı için deploy
.\deploy-staging.ps1

# test.cari-soft.com'a yükle, test et
```

Tüm senaryoları test et:
- [ ] Mevcut özellikler çalışıyor mu?
- [ ] Yeni özellik çalışıyor mu?
- [ ] Veriler kayıp mı?

### ADIM 3: Production DB Yedeği AL ⚠️ KRİTİK

**MUTLAKA YEDEK AL!** Hata olursa geri dönebilmek için:

Plesk'te:
1. **Databases** sekmesine git
2. `carisoft` → **"Dökümü dışarı aktar"**
3. ZIP dosyasını indir
4. Güvenli bir yerde sakla (örn: `C:\CariSoft-Backups\2026-05-01-update-oncesi.zip`)

### ADIM 4: Production'a Deploy

```bash
# main'e merge
git checkout main
git pull origin main
git merge staging
git push origin main

# Production build
.\deploy.ps1
```

### ADIM 5: Dosyaları Yükle

⚠️ **DİKKAT:** Şu klasörleri SİLME:
- `App_Data/` ← SQLite DB'si burada (kullanılıyorsa)
- `logs/` ← Uygulama logları
- `wwwroot/uploads/` ← Kullanıcı logoları

**İKİ SEÇENEK:**

#### Seçenek A: Sadece Değişen Dosyaları Yükle (Önerilen)
FileZilla ile `Cari Soft-Setup/` içini `httpdocs`'a yükle:
- **Overwrite: ✅ All**
- **Skip existing: ❌ Hayır**

Bu App_Data ve logs'u korur çünkü onlar Setup'ta yok.

#### Seçenek B: Tamamını Değiştir (Dikkat!)
1. Önce `App_Data`, `logs`, `wwwroot/uploads` klasörlerini bilgisayarına **indir** (yedek)
2. `httpdocs`'taki dosyaları **sil** (bu klasörler hariç)
3. Yeni `Cari Soft-Setup/` içini yükle
4. Eski `App_Data`, `logs`, `wwwroot/uploads` klasörlerini **geri yükle**

### ADIM 6: DB Değişikliği Varsa (Tip 2)

Eğer yeni migration eklendiyse, DB'ye kolon/tablo eklemek gerekir:

**SQL Server ile:**

1. Plesk DB yönetim arayüzünden `carisoft` DB'sine bağlan
2. Yeni migration'ın SQL'ini çalıştır

Örnek — yeni bir kolon ekleme:
```sql
ALTER TABLE Products ADD Barcode2 NVARCHAR(50) NULL;
```

Migration SQL'ini bulmak için lokalde:
```bash
cd backend
dotnet ef migrations script [OncekiMigration] [YeniMigration] --project BarcodePos.Infrastructure --startup-project BarcodePos.API --context AppDbContext
```

Bu komut sana sadece değişiklikleri içeren SQL'i verir.

### ADIM 7: Restart App

Plesk > Dotnet > **Restart App**

### ADIM 8: Canlıda Test

- [ ] `https://cari-soft.com` açılıyor mu?
- [ ] Mevcut bir kullanıcı giriş yapabiliyor mu?
- [ ] Yeni özellik çalışıyor mu?
- [ ] Eski veriler duruyor mu?

### ADIM 9: Kullanıcılara Duyuru

E-posta / WhatsApp ile müşterilere:
- "Sistem güncellendi, yeni özellikler: ..."
- "Bir sorun yaşarsanız lütfen bize ulaşın"

---

## 🚨 Acil Geri Dönüş (Rollback)

Canlıda ciddi hata çıkarsa:

### 1. Hızlı Rollback (Kod)

```bash
# Bir önceki commit'e dön
git checkout main
git reset --hard HEAD~1
git push --force origin main

# Tekrar deploy
.\deploy.ps1
# Plesk'e yükle, Restart App
```

### 2. DB Rollback (Gerekirse)

1. Plesk > Databases > `carisoft` → **Remove**
2. Yeni `carisoft` DB oluştur (aynı kullanıcı/şifreyle)
3. Yedek ZIP'i **"Dökümü içeri aktar"** ile yükle

---

## Güncelleme Zamanlaması

| Zaman | Risk | Önerilir mi |
|-------|------|:---:|
| Gündüz (müşteriler aktif) | Yüksek | ❌ |
| Akşam 22:00 - 02:00 | Düşük | ✅ |
| Pazar sabahı | En düşük | ✅ |

**Minimum downtime:** ~30 saniye (restart + DB warmup)

---

## Güncelleme Checklist

### Öncesi
- [ ] Staging'de test edildi
- [ ] DB yedeği alındı
- [ ] Değişiklik notu hazırlandı
- [ ] Kritik müşterilere haber verildi

### Sırasında
- [ ] Dosyalar yüklendi
- [ ] (Gerekiyorsa) DB SQL'i çalıştırıldı
- [ ] Restart App yapıldı

### Sonrası
- [ ] Site açılıyor
- [ ] Giriş yapılabiliyor
- [ ] Yeni özellik çalışıyor
- [ ] Eski veriler duruyor
- [ ] 10 dk logları izle (hata var mı?)
- [ ] Kullanıcılara duyuru gönderildi

---

## Sıkça Sorulan Sorular

### 1. "Migration" ne demek?
Veritabanı yapısındaki değişikliklerin SQL script'leri. Örneğin yeni bir kolon eklemek.

### 2. EnsureCreated varken migration nasıl eklerim?
Şu an SQL Server için `EnsureCreated()` kullanıyoruz — yani ilk kurulumda tabloları oluşturuyor. **Sonraki güncellemelerde** DB'ye dokunmuyor.

**Sonraki güncellemelerde manuel SQL çalıştırmak gerekir** (ADIM 6).

İleride migration'lara geçmek istersen ayrı bir iş — şimdilik manuel SQL yeterli.

### 3. Kullanıcılar güncelleme sırasında ne görür?
- Restart App sırasında ~10-30 saniye "502 Bad Gateway" hatası
- Sonra normal çalışır
- Verileri kaybolmaz

### 4. En güvenli yol nedir?
1. Staging'de test et
2. DB yedek al
3. Pazar sabahı deploy et
4. 30 dk logları izle
5. Sorun yoksa devam, varsa rollback

---

## Özet: Basit Bir Güncelleme Yapıyorum Hemen Ne Yapayım?

Eğer kod değişikliği (UI, buton, vs.) ise:

```
1. Plesk > Databases > carisoft > Döküm Dışarı Aktar (YEDEK!)
2. .\deploy.ps1 (lokalde)
3. FileZilla > Cari Soft-Setup içini httpdocs'a yükle (Overwrite: All)
4. Plesk > Dotnet > Restart App
5. cari-soft.com → test et
```

Bu kadar. **3-5 dakika sürer.**
