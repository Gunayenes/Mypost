using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class WebCustomerConfiguration : IEntityTypeConfiguration<WebCustomer>
{
    public void Configure(EntityTypeBuilder<WebCustomer> builder)
    {
        builder.HasIndex(e => e.Email).IsUnique();
        builder.Property(e => e.Email).HasMaxLength(256).IsRequired();
        builder.Property(e => e.PasswordHash).IsRequired();
        builder.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.LastName).HasMaxLength(100).IsRequired();
        builder.Property(e => e.BusinessName).HasMaxLength(200).IsRequired();
        builder.Property(e => e.Phone).HasMaxLength(20);
        builder.Property(e => e.EmailConfirmToken).HasMaxLength(128);
        builder.Property(e => e.PasswordResetToken).HasMaxLength(128);

        builder.HasOne(e => e.Store)
            .WithMany()
            .HasForeignKey(e => e.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed: varsayılan admin kullanıcıyı WebCustomer olarak bağla
        builder.HasData(new WebCustomer
        {
            Id = 1,
            Email = "admin",
            PasswordHash = "$2a$11$GBrDulOzslTYDkE9UmrYg.eyFLfqWXNkYE4g9Qn7HMxnFyDy198AK", // Admin123!
            FirstName = "Sistem",
            LastName = "Yöneticisi",
            BusinessName = "Ana Mağaza",
            EmailConfirmed = true,
            IsActive = true,
            StoreId = 1,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
