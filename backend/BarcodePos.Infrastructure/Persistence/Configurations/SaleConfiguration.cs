using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class SaleConfiguration : IEntityTypeConfiguration<Sale>
{
    public void Configure(EntityTypeBuilder<Sale> builder)
    {
        builder.ToTable("Sales");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.ReceiptNumber).IsRequired().HasMaxLength(50);
        builder.Property(s => s.SubTotal).HasColumnType("TEXT");
        builder.Property(s => s.TaxTotal).HasColumnType("TEXT");
        builder.Property(s => s.DiscountTotal).HasColumnType("TEXT");
        builder.Property(s => s.GrandTotal).HasColumnType("TEXT");
        builder.Property(s => s.PaymentType).HasConversion<int>();
        builder.Property(s => s.Status).HasConversion<int>();

        builder.HasIndex(s => s.ReceiptNumber).IsUnique();
        builder.HasIndex(s => new { s.StoreId, s.SaleDate });

        builder.HasOne(s => s.Store)
            .WithMany(st => st.Sales)
            .HasForeignKey(s => s.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.User)
            .WithMany(u => u.Sales)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Anonim satÄ±ÅŸ â€” CustomerId nullable
        builder.HasOne(s => s.Customer)
            .WithMany(c => c.Sales)
            .HasForeignKey(s => s.CustomerId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

