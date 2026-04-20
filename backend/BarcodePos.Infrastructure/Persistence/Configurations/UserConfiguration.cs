using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);
        builder.Property(u => u.Username).IsRequired().HasMaxLength(50);
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.Property(u => u.FullName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Role).HasConversion<int>();

        builder.HasIndex(u => u.Username).IsUnique();
        builder.HasIndex(u => new { u.StoreId, u.Username }).IsUnique();

        builder.HasOne(u => u.Store)
            .WithMany(s => s.Users)
            .HasForeignKey(u => u.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed: varsayılan admin kullanıcı
        builder.HasData(new User
        {
            Id = 1,
            StoreId = 1,
            Username = "admin",
            PasswordHash = "$2a$11$GBrDulOzslTYDkE9UmrYg.eyFLfqWXNkYE4g9Qn7HMxnFyDy198AK",
            FullName = "Sistem Yöneticisi",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
