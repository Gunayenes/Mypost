using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class CustomerTransactionConfiguration : IEntityTypeConfiguration<CustomerTransaction>
{
    public void Configure(EntityTypeBuilder<CustomerTransaction> builder)
    {
        builder.ToTable("CustomerTransactions");

        builder.HasKey(ct => ct.Id);
        builder.Property(ct => ct.Amount).HasPrecision(18, 2);
        builder.Property(ct => ct.BalanceAfter).HasPrecision(18, 2);
        builder.Property(ct => ct.Type).HasConversion<int>();
        builder.Property(ct => ct.Note).HasMaxLength(500);

        builder.HasOne(ct => ct.Customer)
            .WithMany(c => c.Transactions)
            .HasForeignKey(ct => ct.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        // SaleId nullable â€” Ã¶deme iÅŸlemlerinde satÄ±ÅŸ olmayabilir
        builder.HasOne(ct => ct.Sale)
            .WithMany(s => s.CustomerTransactions)
            .HasForeignKey(ct => ct.SaleId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

