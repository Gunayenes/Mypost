using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.HasOne(e => e.WebCustomer)
            .WithMany(c => c.Subscriptions)
            .HasForeignKey(e => e.WebCustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Plan)
            .WithMany(p => p.Subscriptions)
            .HasForeignKey(e => e.PlanId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed: varsayılan admin için Kurumsal abonelik
        builder.HasData(new Subscription
        {
            Id = 1,
            WebCustomerId = 1,
            PlanId = 3, // Kurumsal
            StartsAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            ExpiresAt = new DateTime(2099, 12, 31, 0, 0, 0, DateTimeKind.Utc),
            IsActive = true,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
