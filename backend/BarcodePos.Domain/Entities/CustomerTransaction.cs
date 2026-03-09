using BarcodePos.Domain.Common;
using BarcodePos.Domain.Enums;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Müşteri hesap hareketi.
/// Borc: veresiye satıştan oluşan borç (SaleId ile ilişkili).
/// Odeme: müşterinin yaptığı tahsilat.
/// BalanceAfter: işlem sonrası güncel bakiye.
/// </summary>
public class CustomerTransaction : BaseEntity
{
    public int CustomerId { get; set; }
    public int? SaleId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Note { get; set; }

    // Navigation
    public Customer Customer { get; set; } = null!;
    public Sale? Sale { get; set; }
}
