namespace BarcodePos.Application.DTOs.Services;

// ── Servis Kaydı ──

public class ServiceRecordDto
{
    public int Id { get; set; }
    public string ServiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public int? AssignedUserId { get; set; }
    public string? AssignedUserName { get; set; }
    public string ReceivedByUserName { get; set; } = string.Empty;

    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceBrand { get; set; }
    public string? DeviceModel { get; set; }
    public string? DeviceSerial { get; set; }
    public string? DeviceAccessories { get; set; }
    public string? DeviceCondition { get; set; }

    public string FaultDescription { get; set; } = string.Empty;
    public string? CustomerNote { get; set; }

    public string Status { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string PriorityName { get; set; } = string.Empty;

    public DateTime? EstimatedCompletionDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }

    public decimal LaborCost { get; set; }
    public decimal PartsCost { get; set; }
    public decimal TotalCost { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public string PaymentStatusName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<ServiceLogDto> Logs { get; set; } = [];
    public List<ServicePartDto> Parts { get; set; } = [];
}

public class ServiceListDto
{
    public int Id { get; set; }
    public string ServiceNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceBrand { get; set; }
    public string FaultDescription { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string PriorityName { get; set; } = string.Empty;
    public string? AssignedUserName { get; set; }
    public string? DeviceModel { get; set; }
    public decimal TotalCost { get; set; }
    public string PaymentStatusName { get; set; } = string.Empty;
    public DateTime? EstimatedCompletionDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Log ──

public class ServiceLogDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? OldStatusName { get; set; }
    public string? NewStatusName { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ── Parça ──

public class ServicePartDto
{
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public bool DeductedFromStock { get; set; }
    public string AddedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ── Request'ler ──

public class CreateServiceRequest
{
    public int CustomerId { get; set; }
    public int? AssignedUserId { get; set; }

    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceBrand { get; set; }
    public string? DeviceModel { get; set; }
    public string? DeviceSerial { get; set; }
    public string? DeviceAccessories { get; set; }
    public string? DeviceCondition { get; set; }

    public string FaultDescription { get; set; } = string.Empty;
    public string? CustomerNote { get; set; }
    public string Priority { get; set; } = "Dusuk";
    public DateTime? EstimatedCompletionDate { get; set; }
}

public class UpdateServiceRequest
{
    public int? AssignedUserId { get; set; }
    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceBrand { get; set; }
    public string? DeviceModel { get; set; }
    public string? DeviceSerial { get; set; }
    public string? DeviceAccessories { get; set; }
    public string? DeviceCondition { get; set; }
    public string FaultDescription { get; set; } = string.Empty;
    public string? CustomerNote { get; set; }
    public string Priority { get; set; } = "Dusuk";
    public DateTime? EstimatedCompletionDate { get; set; }
    public decimal LaborCost { get; set; }
}

public class UpdateServiceStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Note { get; set; }
    public bool IsInternal { get; set; }
}

public class UpdateServicePriorityRequest
{
    public string Priority { get; set; } = string.Empty;
}

public class AddServicePartRequest
{
    public int? ProductId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal UnitCost { get; set; }
}

public class AddServicePaymentRequest
{
    public decimal Amount { get; set; }
    public string? Note { get; set; }
}

public class AddServiceLogRequest
{
    public string Description { get; set; } = string.Empty;
    public bool IsInternal { get; set; }
}

public class ServiceListFilter
{
    public string? Search { get; set; }
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public int? CustomerId { get; set; }
    public int? AssignedUserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class ServiceSummaryDto
{
    public int TotalCount { get; set; }
    public int KayitAcildiCount { get; set; }
    public int IncelemedeCount { get; set; }
    public int OnayBekliyorCount { get; set; }
    public int ParcaBekliyorCount { get; set; }
    public int IslemdeCount { get; set; }
    public int TamamlandiCount { get; set; }
    public int TeslimEdildiCount { get; set; }
    public int IptalEdildiCount { get; set; }
    public int BorcluCount { get; set; }
}

// ── Müşteri Takip (Dış sorgu) ──

public class ServiceTrackingDto
{
    public string ServiceNumber { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string? DeviceBrand { get; set; }
    public string? DeviceModel { get; set; }
    public string FaultDescription { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public DateTime? EstimatedCompletionDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public DateTime? DeliveredDate { get; set; }
    public decimal TotalCost { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentStatusName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<ServiceTrackingLogDto> Logs { get; set; } = [];
    public List<ServiceTrackingPartDto> Parts { get; set; } = [];
}

public class ServiceTrackingLogDto
{
    public string? StatusName { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ServiceTrackingPartDto
{
    public string PartName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal TotalCost { get; set; }
}
