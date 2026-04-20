using BarcodePos.Domain.Common;
using BarcodePos.Domain.Enums;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Servis kaydı. Müşterinin bıraktığı cihaz/ürün için açılan teknik servis talebi.
/// ServiceNumber benzersiz takip numarasıdır (müşteri dışarıdan sorgular).
/// </summary>
public class ServiceRecord : AuditableEntity
{
    public int StoreId { get; set; }
    public int CustomerId { get; set; }
    public int? AssignedUserId { get; set; }
    public int ReceivedByUserId { get; set; }

    public string ServiceNumber { get; set; } = string.Empty;

    // Cihaz / ürün bilgisi
    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceBrand { get; set; }
    public string? DeviceModel { get; set; }
    public string? DeviceSerial { get; set; }
    public string? DeviceAccessories { get; set; }
    public string? DeviceCondition { get; set; }

    // Arıza / talep
    public string FaultDescription { get; set; } = string.Empty;
    public string? CustomerNote { get; set; }

    // Durum
    public ServiceStatus Status { get; set; } = ServiceStatus.KayitAcildi;
    public ServicePriority Priority { get; set; } = ServicePriority.Dusuk;

    // Tarihler
    public DateTime? EstimatedCompletionDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }

    // Ücretler
    public decimal LaborCost { get; set; }
    public decimal PartsCost { get; set; }
    public decimal TotalCost { get; set; }
    public decimal PaidAmount { get; set; }
    public ServicePaymentStatus PaymentStatus { get; set; } = ServicePaymentStatus.Odenmedi;

    // Navigation
    public Store Store { get; set; } = null!;
    public Customer Customer { get; set; } = null!;
    public User? AssignedUser { get; set; }
    public User ReceivedByUser { get; set; } = null!;
    public ICollection<ServiceLog> Logs { get; set; } = [];
    public ICollection<ServicePart> Parts { get; set; } = [];
}
