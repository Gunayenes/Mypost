using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Web platformu müşterisi. POS kullanıcısından (User) ayrıdır.
/// Her WebCustomer kayıt olduğunda otomatik bir Store ve Admin User oluşturulur.
/// </summary>
public class WebCustomer : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string? Phone { get; set; }

    // E-posta doğrulama
    public bool EmailConfirmed { get; set; }
    public string? EmailConfirmToken { get; set; }
    public DateTime? EmailConfirmExpiry { get; set; }

    // Şifre sıfırlama
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetExpiry { get; set; }

    public bool IsActive { get; set; } = true;

    // İlişkili mağaza (kayıt sırasında otomatik oluşturulur)
    public int StoreId { get; set; }
    public Store Store { get; set; } = null!;

    // Navigation
    public ICollection<Subscription> Subscriptions { get; set; } = [];
}
