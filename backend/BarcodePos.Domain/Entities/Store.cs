using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Mağaza bilgisi. Tüm kritik entity'ler StoreId ile ilişkilendirilir.
/// v1'de tek mağaza aktif, ancak çoklu mağaza altyapısı hazır tutulur.
/// </summary>
public class Store : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? LogoPath { get; set; }
    public string? ThemeColor { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<User> Users { get; set; } = [];
    public ICollection<Category> Categories { get; set; } = [];
    public ICollection<Product> Products { get; set; } = [];
    public ICollection<Sale> Sales { get; set; } = [];
    public ICollection<Customer> Customers { get; set; } = [];
}
