using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Barcode).IsRequired().HasMaxLength(50);
        builder.Property(p => p.Name).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Description).HasMaxLength(500);
        builder.Property(p => p.CostPrice).HasColumnType("TEXT");
        builder.Property(p => p.SalePrice).HasColumnType("TEXT");
        builder.Property(p => p.CostPriceUsd).HasColumnType("TEXT");
        builder.Property(p => p.SalePriceUsd).HasColumnType("TEXT");
        builder.Property(p => p.ExchangeRate).HasColumnType("TEXT");
        builder.Property(p => p.TaxRate).HasColumnType("TEXT");

        // Barkod maÄŸaza bazÄ±nda benzersiz
        builder.HasIndex(p => new { p.StoreId, p.Barcode }).IsUnique();
        builder.HasIndex(p => p.CategoryId);

        builder.HasOne(p => p.Store)
            .WithMany(s => s.Products)
            .HasForeignKey(p => p.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed: Ã¶rnek Ã¼rÃ¼nler (gerÃ§ekÃ§i barkodlar)
        var date = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        builder.HasData(
            // Ä°Ã§ecekler
            new Product { Id = 1,  StoreId = 1, CategoryId = 1, Barcode = "8690494017710", Name = "Coca-Cola 330ml",       CostPrice = 8.00m,  SalePrice = 12.50m,  TaxRate = 10, StockQuantity = 200, MinStockLevel = 20, IsActive = true, CreatedAt = date },
            new Product { Id = 2,  StoreId = 1, CategoryId = 1, Barcode = "8690494017727", Name = "Coca-Cola 1L",          CostPrice = 14.00m, SalePrice = 22.00m,  TaxRate = 10, StockQuantity = 150, MinStockLevel = 15, IsActive = true, CreatedAt = date },
            new Product { Id = 3,  StoreId = 1, CategoryId = 1, Barcode = "8690637000508", Name = "Erikli Su 500ml",       CostPrice = 2.00m,  SalePrice = 5.00m,   TaxRate = 1,  StockQuantity = 500, MinStockLevel = 50, IsActive = true, CreatedAt = date },
            new Product { Id = 4,  StoreId = 1, CategoryId = 1, Barcode = "8690637000515", Name = "Erikli Su 1.5L",        CostPrice = 3.50m,  SalePrice = 7.50m,   TaxRate = 1,  StockQuantity = 300, MinStockLevel = 30, IsActive = true, CreatedAt = date },
            new Product { Id = 5,  StoreId = 1, CategoryId = 1, Barcode = "8690504550013", Name = "Ã‡aykur Rize Ã‡ay 1kg",   CostPrice = 85.00m, SalePrice = 119.90m, TaxRate = 10, StockQuantity = 40,  MinStockLevel = 10, IsActive = true, CreatedAt = date },
            new Product { Id = 6,  StoreId = 1, CategoryId = 1, Barcode = "8690632042008", Name = "Nescafe 3in1",          CostPrice = 3.50m,  SalePrice = 6.00m,   TaxRate = 10, StockQuantity = 100, MinStockLevel = 20, IsActive = true, CreatedAt = date },

            // AtÄ±ÅŸtÄ±rmalÄ±klar
            new Product { Id = 7,  StoreId = 1, CategoryId = 2, Barcode = "8690504055501", Name = "Ãœlker Ã‡ikolatalÄ± Gofret", CostPrice = 5.00m,  SalePrice = 8.50m,   TaxRate = 10, StockQuantity = 120, MinStockLevel = 15, IsActive = true, CreatedAt = date },
            new Product { Id = 8,  StoreId = 1, CategoryId = 2, Barcode = "8690504055518", Name = "Eti Canga",               CostPrice = 7.00m,  SalePrice = 12.00m,  TaxRate = 10, StockQuantity = 80,  MinStockLevel = 10, IsActive = true, CreatedAt = date },
            new Product { Id = 9,  StoreId = 1, CategoryId = 2, Barcode = "8690624000016", Name = "Doritos Cips 120g",        CostPrice = 15.00m, SalePrice = 24.90m,  TaxRate = 10, StockQuantity = 60,  MinStockLevel = 10, IsActive = true, CreatedAt = date },
            new Product { Id = 10, StoreId = 1, CategoryId = 2, Barcode = "8690504011507", Name = "Ãœlker Petit Beurre",       CostPrice = 10.00m, SalePrice = 16.50m,  TaxRate = 10, StockQuantity = 90,  MinStockLevel = 10, IsActive = true, CreatedAt = date },

            // Temel GÄ±da
            new Product { Id = 11, StoreId = 1, CategoryId = 3, Barcode = "8690804000011", Name = "SÃ¼t 1L (GÃ¼nlÃ¼k)",        CostPrice = 12.00m, SalePrice = 18.50m,  TaxRate = 1,  StockQuantity = 100, MinStockLevel = 20, IsActive = true, CreatedAt = date },
            new Product { Id = 12, StoreId = 1, CategoryId = 3, Barcode = "8690804000028", Name = "Yumurta 15'li",          CostPrice = 35.00m, SalePrice = 54.90m,  TaxRate = 1,  StockQuantity = 50,  MinStockLevel = 10, IsActive = true, CreatedAt = date },
            new Product { Id = 13, StoreId = 1, CategoryId = 3, Barcode = "8690804000035", Name = "Ekmek (Tam BuÄŸday)",     CostPrice = 8.00m,  SalePrice = 12.00m,  TaxRate = 1,  StockQuantity = 30,  MinStockLevel = 5,  IsActive = true, CreatedAt = date },
            new Product { Id = 14, StoreId = 1, CategoryId = 3, Barcode = "8690804000042", Name = "Un 2kg (Sinangil)",      CostPrice = 20.00m, SalePrice = 32.50m,  TaxRate = 1,  StockQuantity = 40,  MinStockLevel = 8,  IsActive = true, CreatedAt = date },
            new Product { Id = 15, StoreId = 1, CategoryId = 3, Barcode = "8690804000059", Name = "Åeker 1kg",              CostPrice = 14.00m, SalePrice = 22.90m,  TaxRate = 1,  StockQuantity = 60,  MinStockLevel = 10, IsActive = true, CreatedAt = date },

            // Temizlik
            new Product { Id = 16, StoreId = 1, CategoryId = 4, Barcode = "8690506000011", Name = "Fairy BulaÅŸÄ±k Det. 500ml", CostPrice = 25.00m, SalePrice = 39.90m,  TaxRate = 20, StockQuantity = 45,  MinStockLevel = 10, IsActive = true, CreatedAt = date },
            new Product { Id = 17, StoreId = 1, CategoryId = 4, Barcode = "8690506000028", Name = "Domestos 750ml",           CostPrice = 22.00m, SalePrice = 36.50m,  TaxRate = 20, StockQuantity = 35,  MinStockLevel = 8,  IsActive = true, CreatedAt = date },
            new Product { Id = 18, StoreId = 1, CategoryId = 4, Barcode = "8690506000035", Name = "Selpak Tuvalet KaÄŸÄ±dÄ± 16lÄ±", CostPrice = 55.00m, SalePrice = 84.90m, TaxRate = 20, StockQuantity = 25,  MinStockLevel = 5,  IsActive = true, CreatedAt = date },

            // KiÅŸisel BakÄ±m
            new Product { Id = 19, StoreId = 1, CategoryId = 5, Barcode = "8690506500017", Name = "Head&Shoulders 400ml",    CostPrice = 45.00m, SalePrice = 69.90m,  TaxRate = 20, StockQuantity = 30,  MinStockLevel = 5,  IsActive = true, CreatedAt = date },
            new Product { Id = 20, StoreId = 1, CategoryId = 5, Barcode = "8690506500024", Name = "Colgate DiÅŸ Macunu 75ml", CostPrice = 18.00m, SalePrice = 29.90m,  TaxRate = 20, StockQuantity = 50,  MinStockLevel = 10, IsActive = true, CreatedAt = date }
        );
    }
}

