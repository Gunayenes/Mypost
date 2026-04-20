using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
    {
        builder.HasIndex(e => e.Slug).IsUnique();
        builder.Property(e => e.Name).HasMaxLength(100).IsRequired();
        builder.Property(e => e.Slug).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Price).HasColumnType("decimal(10,2)");

        builder.HasData(
            new SubscriptionPlan
            {
                Id = 1, Name = "Demo", Slug = "demo", Price = 0,
                DurationDays = 14, MaxProducts = int.MaxValue, MaxUsers = int.MaxValue,
                HasReports = true, HasBackup = true, HasSupport = true,
                IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SubscriptionPlan
            {
                Id = 2, Name = "Profesyonel", Slug = "pro", Price = 299,
                DurationDays = 30, MaxProducts = int.MaxValue, MaxUsers = 3,
                HasReports = true, HasBackup = true, HasSupport = true,
                IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new SubscriptionPlan
            {
                Id = 3, Name = "Kurumsal", Slug = "enterprise", Price = 0,
                DurationDays = 365, MaxProducts = int.MaxValue, MaxUsers = int.MaxValue,
                HasReports = true, HasBackup = true, HasSupport = true,
                IsActive = true, CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
