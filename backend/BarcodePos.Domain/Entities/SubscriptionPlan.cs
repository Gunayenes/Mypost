using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Abonelik planı tanımları (Demo, Profesyonel, Kurumsal).
/// </summary>
public class SubscriptionPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public int MaxProducts { get; set; }
    public int MaxUsers { get; set; }
    public bool HasReports { get; set; }
    public bool HasBackup { get; set; }
    public bool HasSupport { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Subscription> Subscriptions { get; set; } = [];
}
