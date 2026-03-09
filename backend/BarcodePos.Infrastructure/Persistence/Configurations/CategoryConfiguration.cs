using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(500);

        builder.HasIndex(c => c.StoreId);

        builder.HasOne(c => c.Store)
            .WithMany(s => s.Categories)
            .HasForeignKey(c => c.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed: örnek kategoriler
        var date = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        builder.HasData(
            new Category { Id = 1, StoreId = 1, Name = "İçecekler", Description = "Soğuk ve sıcak içecekler", IsActive = true, CreatedAt = date },
            new Category { Id = 2, StoreId = 1, Name = "Atıştırmalıklar", Description = "Çikolata, cips, bisküvi", IsActive = true, CreatedAt = date },
            new Category { Id = 3, StoreId = 1, Name = "Temel Gıda", Description = "Ekmek, süt, yumurta, un", IsActive = true, CreatedAt = date },
            new Category { Id = 4, StoreId = 1, Name = "Temizlik", Description = "Deterjan, sabun, kağıt ürünleri", IsActive = true, CreatedAt = date },
            new Category { Id = 5, StoreId = 1, Name = "Kişisel Bakım", Description = "Şampuan, diş macunu, deodorant", IsActive = true, CreatedAt = date }
        );
    }
}
