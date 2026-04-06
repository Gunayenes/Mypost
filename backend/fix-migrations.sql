-- SeedAdminWebCustomer migration'ını atla (veriler zaten mevcut)
INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260403090153_SeedAdminWebCustomer', '10.0.3');

-- LogoPath kolonunu ekle (yoksa)
ALTER TABLE Stores ADD COLUMN LogoPath TEXT;

-- SplitPayment kolonlarını ekle (yoksa)
ALTER TABLE Sales ADD COLUMN PaidCash TEXT NOT NULL DEFAULT '0';
ALTER TABLE Sales ADD COLUMN PaidCard TEXT NOT NULL DEFAULT '0';

-- Bu migration'ları da uygulanmış olarak işaretle
INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260403092059_AddStoreLogoPath', '10.0.3');
INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ('20260406113843_AddSplitPayment', '10.0.3');
