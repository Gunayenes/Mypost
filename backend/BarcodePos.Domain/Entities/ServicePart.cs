using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Serviste kullanılan parça. Product ile ilişkili ise stoktan düşülür.
/// ProductId null ise stok dışı (haricen temin edilen) parça demektir.
/// </summary>
public class ServicePart : BaseEntity
{
    public int ServiceRecordId { get; set; }
    public int? ProductId { get; set; }
    public int UserId { get; set; }

    public string PartName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public bool DeductedFromStock { get; set; }

    // Navigation
    public ServiceRecord ServiceRecord { get; set; } = null!;
    public Product? Product { get; set; }
    public User User { get; set; } = null!;
}
