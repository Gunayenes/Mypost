using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Müşteri aboneliği. Her müşterinin aktif bir aboneliği olur.
/// </summary>
public class Subscription : BaseEntity
{
    public int WebCustomerId { get; set; }
    public int PlanId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public WebCustomer WebCustomer { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
}
