using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Müşteri bilgisi. Veresiye (borç/alacak) takibi için kullanılır.
/// Balance > 0 ise müşteri borçludur.
/// Anonim satışlarda müşteri zorunlu değildir.
/// </summary>
public class Customer : AuditableEntity
{
    public int StoreId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public decimal Balance { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Store Store { get; set; } = null!;
    public ICollection<Sale> Sales { get; set; } = [];
    public ICollection<CustomerTransaction> Transactions { get; set; } = [];
}
