using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.FullName).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Phone).HasMaxLength(20);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.Property(c => c.Address).HasMaxLength(500);
        builder.Property(c => c.Balance).HasPrecision(18, 2).HasDefaultValue(0m);

        builder.HasOne(c => c.Store)
            .WithMany(s => s.Customers)
            .HasForeignKey(c => c.StoreId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

