using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BarcodePos.Infrastructure.Persistence.Configurations;

public class ServicePartConfiguration : IEntityTypeConfiguration<ServicePart>
{
    public void Configure(EntityTypeBuilder<ServicePart> builder)
    {
        builder.ToTable("ServiceParts");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.PartName).IsRequired().HasMaxLength(200);
        builder.Property(p => p.UnitCost).HasColumnType("TEXT");
        builder.Property(p => p.TotalCost).HasColumnType("TEXT");

        builder.HasIndex(p => p.ServiceRecordId);

        builder.HasOne(p => p.ServiceRecord)
            .WithMany(s => s.Parts)
            .HasForeignKey(p => p.ServiceRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Product)
            .WithMany()
            .HasForeignKey(p => p.ProductId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
