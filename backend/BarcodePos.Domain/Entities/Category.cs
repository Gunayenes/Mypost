using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Ürün kategorisi. Mağaza bazında benzersiz isim gerektirir.
/// </summary>
public class Category : AuditableEntity
{
    public int StoreId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Store Store { get; set; } = null!;
    public ICollection<Product> Products { get; set; } = [];
}
