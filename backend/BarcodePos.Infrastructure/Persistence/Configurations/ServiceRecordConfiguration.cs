using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class ServiceRecordConfiguration : IEntityTypeConfiguration<ServiceRecord>
{
    public void Configure(EntityTypeBuilder<ServiceRecord> builder)
    {
        builder.ToTable("ServiceRecords");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.ServiceNumber).IsRequired().HasMaxLength(50);
        builder.Property(s => s.DeviceName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.DeviceBrand).HasMaxLength(100);
        builder.Property(s => s.DeviceModel).HasMaxLength(100);
        builder.Property(s => s.DeviceSerial).HasMaxLength(100);
        builder.Property(s => s.DeviceAccessories).HasMaxLength(500);
        builder.Property(s => s.DeviceCondition).HasMaxLength(500);
        builder.Property(s => s.FaultDescription).IsRequired().HasMaxLength(2000);
        builder.Property(s => s.CustomerNote).HasMaxLength(1000);

        builder.Property(s => s.LaborCost).HasPrecision(18, 2);
        builder.Property(s => s.PartsCost).HasPrecision(18, 2);
        builder.Property(s => s.TotalCost).HasPrecision(18, 2);
        builder.Property(s => s.PaidAmount).HasPrecision(18, 2);

        builder.Property(s => s.Status).HasConversion<int>();
        builder.Property(s => s.Priority).HasConversion<int>();
        builder.Property(s => s.PaymentStatus).HasConversion<int>();

        builder.HasIndex(s => s.ServiceNumber).IsUnique();
        builder.HasIndex(s => new { s.StoreId, s.Status });
        builder.HasIndex(s => new { s.StoreId, s.CustomerId });

        builder.HasOne(s => s.Store)
            .WithMany()
            .HasForeignKey(s => s.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Customer)
            .WithMany()
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.AssignedUser)
            .WithMany()
            .HasForeignKey(s => s.AssignedUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.ReceivedByUser)
            .WithMany()
            .HasForeignKey(s => s.ReceivedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
