# Cari Soft — Git Workflow & Deploy Rehberi

Profesyonel 2-ortamlı deploy akışı. Önce test, sonra canlı.

## Branch Yapısı

```
main       → https://cari-soft.com         (CANLI - müşteriler kullanır)
staging    → https://test.cari-soft.com    (TEST - sen ve ekibin test eder)
feature/*  → Geliştirme (staging'e merge edilir)
fix/*      → Hata düzeltmesi (staging'e merge edilir)
```

## Altın Kural

**HİÇBİR KOD DOĞRUDAN `main`'e PUSH EDİLMEZ.** Akış her zaman:

```
feature/X → staging → main
```

## Yeni Özellik Nasıl Eklenir?

### 1. Feature branch oluştur (staging'den)

```bash
git checkout staging
git pull origin staging
git checkout -b feature/yeni-ozellik
```

### 2. Geliştirmeyi yap, commit'le

```bash
# kod değiştir...
git add .
git commit -m "feat: yeni özellik eklendi"
```

### 3. Staging'e merge et

```bash
git checkout staging
git merge feature/yeni-ozellik
git push origin staging
```

→ Bu otomatik olarak **test.cari-soft.com**'a deploy edilir (manuel veya CI/CD ile)

### 4. Test ortamında kontrol et

- https://test.cari-soft.com adresine git
- Yeni özelliği test et
- Hata yoksa devam, varsa feature branch'te düzelt

### 5. Canlıya al (main'e merge)

```bash
git checkout main
git pull origin main
git merge staging
git push origin main
```

→ Bu otomatik olarak **cari-soft.com**'a deploy edilir

### 6. Feature branch'i temizle

```bash
git branch -d feature/yeni-ozellik
git push origin --delete feature/yeni-ozellik
```

## Hata Düzeltme (Acil - Production'da)

Eğer canlıda kritik bir hata varsa:

```bash
git checkout main
git checkout -b fix/acil-hata
# düzeltmeyi yap
git commit -m "fix: acil hata düzeltildi"

# Önce staging'e
git checkout staging
git merge fix/acil-hata
git push origin staging
# Test et

# Sonra main'e
git checkout main
git merge fix/acil-hata
git push origin main
```

## Deploy Komutları

### Staging Deploy (test.cari-soft.com)

```powershell
.\deploy-staging.ps1
```

Çıktı: `CariSoft-Staging/` klasörü
Plesk'te `test.cari-soft.com` alanına yükle

### Production Deploy (cari-soft.com)

```powershell
.\deploy.ps1
```

Çıktı: `Cari Soft-Setup/` klasörü
Plesk'te `cari-soft.com` alanına yükle

## Plesk'te Konfigürasyon

### İki Ayrı Site Kurulumu

**1. cari-soft.com (Production)**
- Document Root: `httpdocs` (veya kendi seçtiğin)
- Environment Variables:
  ```
  ASPNETCORE_ENVIRONMENT=Production
  JWT_SECRET=prod-secret-xxx
  SITE_ADMIN_EMAIL=admin@cari-soft.com
  SITE_ADMIN_PASSWORD=ProdAdminSifresi
  ALLOWED_ORIGINS=https://cari-soft.com
  APP_BASE_URL=https://cari-soft.com
  ```

**2. test.cari-soft.com (Staging)**
- Plesk'te yeni subdomain oluştur: `test.cari-soft.com`
- Environment Variables:
  ```
  ASPNETCORE_ENVIRONMENT=Staging
  JWT_SECRET=staging-secret-xxx  (FARKLI OLSUN)
  SITE_ADMIN_EMAIL=admin@cari-soft.com
  SITE_ADMIN_PASSWORD=TestAdminSifresi  (FARKLI OLSUN)
  ALLOWED_ORIGINS=https://test.cari-soft.com
  APP_BASE_URL=https://test.cari-soft.com
  ```

### Veritabanları AYRI olmalı

- Production DB: `CariSoft.db` veya `carisoft_prod` (PostgreSQL)
- Staging DB: `CariSoft_Staging.db` veya `carisoft_staging` (PostgreSQL)

**ASLA** test veritabanını canlı ile paylaştırma!

## Test Ortamı Göstergeleri

Test ortamında otomatik olarak:
- Üstte **turuncu banner**: "TEST ORTAMI — Canlı veriler etkilenmez"
- Browser tab'da başlık farkı
- Farklı veritabanı kullanılır

## GitHub Actions (CI)

Her push'ta otomatik olarak çalışır:
- Backend derleme kontrolü (.NET 10)
- Frontend derleme kontrolü (TypeScript + Vite)
- Testler (varsa)

Sonuçları GitHub > Actions sekmesinden görebilirsin.
Hata varsa merge yapmadan düzeltmek gerekir.

## Sıkça Kullanılan Komutlar

```bash
# Mevcut branch'i gör
git branch

# Staging'e geç
git checkout staging

# Main'e geç
git checkout main

# Son commit'leri gör
git log --oneline -10

# Değişiklikleri main'e (production'a) taşı
git checkout main
git merge staging
git push origin main

# Geri alma (rollback)
git checkout main
git revert HEAD        # son commit'i geri al
git push origin main
```

## Best Practices

1. **Her zaman** önce staging'de test et
2. **Feature branch'leri küçük tut** — tek bir değişiklik
3. **Commit mesajları açıklayıcı olsun** (feat:, fix:, docs:, refactor:)
4. **Merge'den önce sync et** (`git pull origin staging`)
5. **Env var'ları asla commit'leme** (.env zaten gitignore'da)
6. **DB backup'ı düzenli al** (özellikle production)
