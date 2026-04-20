using BarcodePos.Domain.Common;
using BarcodePos.Domain.Enums;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Servis işlem kaydı / günlük. Durum değişiklikleri, yapılan işlemler, notlar burada tutulur.
/// IsInternal = true olan notlar müşteriye gösterilmez.
/// </summary>
public class ServiceLog : BaseEntity
{
    public int ServiceRecordId { get; set; }
    public int UserId { get; set; }

    public ServiceStatus? OldStatus { get; set; }
    public ServiceStatus? NewStatus { get; set; }

    public string Description { get; set; } = string.Empty;
    public bool IsInternal { get; set; }

    // Navigation
    public ServiceRecord ServiceRecord { get; set; } = null!;
    public User User { get; set; } = null!;
}
