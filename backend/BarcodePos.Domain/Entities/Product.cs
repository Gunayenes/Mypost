using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Ürün bilgisi. Barkod mağaza bazında benzersizdir.
/// StockQuantity sadece stok hareketi ve satış ile güncellenir, CRUD ile değil.
/// </summary>
public class Product : AuditableEntity
{
    public int StoreId { get; set; }
    public int CategoryId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public decimal TaxRate { get; set; }
    public int StockQuantity { get; set; }
    public int MinStockLevel { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Store Store { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<SaleItem> SaleItems { get; set; } = [];
    public ICollection<StockMovement> StockMovements { get; set; } = [];
}
