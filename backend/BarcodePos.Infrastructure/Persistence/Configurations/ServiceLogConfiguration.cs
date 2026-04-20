using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class ServiceLogConfiguration : IEntityTypeConfiguration<ServiceLog>
{
    public void Configure(EntityTypeBuilder<ServiceLog> builder)
    {
        builder.ToTable("ServiceLogs");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Description).IsRequired().HasMaxLength(2000);
        builder.Property(l => l.OldStatus).HasConversion<int?>();
        builder.Property(l => l.NewStatus).HasConversion<int?>();

        builder.HasIndex(l => l.ServiceRecordId);

        builder.HasOne(l => l.ServiceRecord)
            .WithMany(s => s.Logs)
            .HasForeignKey(l => l.ServiceRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
