using BarcodePos.Domain.Common;
using BarcodePos.Domain.Enums;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Satış işlemi. Sistemin en kritik entity'si.
/// ReceiptNumber benzersiz ve otomatik üretilir (FIS-yyyyMMdd-NNNN).
/// CustomerId nullable — anonim satış desteklenir.
/// </summary>
public class Sale : BaseEntity
{
    public int StoreId { get; set; }
    public int UserId { get; set; }
    public int? CustomerId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;
    public decimal SubTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal GrandTotal { get; set; }
    public PaymentType PaymentType { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.Tamamlandi;

    // Navigation
    public Store Store { get; set; } = null!;
    public User User { get; set; } = null!;
    public Customer? Customer { get; set; }
    public ICollection<SaleItem> Items { get; set; } = [];
    public ICollection<CustomerTransaction> CustomerTransactions { get; set; } = [];
}
