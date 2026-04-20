using BarcodePos.Domain.Common;
using BarcodePos.Domain.Enums;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Sistem kullanıcısı. Admin, Yönetici veya Kasiyer rollerinden birine sahiptir.
/// Her kullanıcı bir mağazaya bağlıdır.
/// </summary>
public class User : AuditableEntity
{
    public int StoreId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Store Store { get; set; } = null!;
    public ICollection<Sale> Sales { get; set; } = [];
    public ICollection<StockMovement> StockMovements { get; set; } = [];
}
