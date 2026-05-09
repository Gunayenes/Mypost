-- Production DB'lerde EnsureCreated() ile eski şemayla oluşturulmuş tablolarda
-- eksik kolonları idempotent şekilde ekler. Mevcut kolonlara dokunmaz.
-- Tüm IF NOT EXISTS kontrollü — kaç kez çalışırsa çalışsın güvenli.

-- ── Sales: Parçalı ödeme alanları (AddSplitPayment migration'ından) ──
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'PaidCash' AND Object_ID = Object_ID(N'Sales'))
BEGIN
    ALTER TABLE Sales ADD PaidCash DECIMAL(18,2) NOT NULL CONSTRAINT DF_Sales_PaidCash DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'PaidCard' AND Object_ID = Object_ID(N'Sales'))
BEGIN
    ALTER TABLE Sales ADD PaidCard DECIMAL(18,2) NOT NULL CONSTRAINT DF_Sales_PaidCard DEFAULT 0;
END
GO

-- ── Products: USD fiyatlama alanları (AddProductUsdPricing migration'ından) ──
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'CostPriceUsd' AND Object_ID = Object_ID(N'Products'))
BEGIN
    ALTER TABLE Products ADD CostPriceUsd DECIMAL(18,2) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'SalePriceUsd' AND Object_ID = Object_ID(N'Products'))
BEGIN
    ALTER TABLE Products ADD SalePriceUsd DECIMAL(18,2) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'ExchangeRate' AND Object_ID = Object_ID(N'Products'))
BEGIN
    ALTER TABLE Products ADD ExchangeRate DECIMAL(18,4) NULL;
END
GO

-- ── Stores: Logo ve tema rengi alanları ──
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'LogoPath' AND Object_ID = Object_ID(N'Stores'))
BEGIN
    ALTER TABLE Stores ADD LogoPath NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE Name = N'ThemeColor' AND Object_ID = Object_ID(N'Stores'))
BEGIN
    ALTER TABLE Stores ADD ThemeColor NVARCHAR(20) NULL;
END
GO
