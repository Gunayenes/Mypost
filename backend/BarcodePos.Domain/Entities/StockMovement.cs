using BarcodePos.Domain.Common;
using BarcodePos.Domain.Enums;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Stok hareketi. Her stok değişikliği burada kayıt altına alınır.
/// Quantity: giriş için +, çıkış için -.
/// StockAfter: hareket sonrası güncel stok miktarı.
/// Manuel türler: Giris, Cikis, Duzeltme.
/// Sistem türleri: Satis, Iade (otomatik oluşturulur).
/// </summary>
public class StockMovement : BaseEntity
{
    public int ProductId { get; set; }
    public int UserId { get; set; }
    public MovementType Type { get; set; }
    public int Quantity { get; set; }
    public int StockAfter { get; set; }
    public string? Note { get; set; }

    // Navigation
    public Product Product { get; set; } = null!;
    public User User { get; set; } = null!;
}
