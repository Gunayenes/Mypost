using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Services;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class ServiceRecordService : IServiceRecordService
{
    private readonly AppDbContext _context;

    public ServiceRecordService(AppDbContext context)
    {
        _context = context;
    }

    // ── Durum adı eşlemesi ──
    private static readonly Dictionary<ServiceStatus, string> StatusNames = new()
    {
        [ServiceStatus.KayitAcildi] = "Kayıt Açıldı",
        [ServiceStatus.Incelemede] = "İncelemede",
        [ServiceStatus.OnayBekliyor] = "Onay Bekliyor",
        [ServiceStatus.ParcaBekliyor] = "Parça Bekleniyor",
        [ServiceStatus.Islemde] = "İşlemde",
        [ServiceStatus.Tamamlandi] = "Tamamlandı",
        [ServiceStatus.TeslimEdildi] = "Teslim Edildi",
        [ServiceStatus.IptalEdildi] = "İptal Edildi",
    };

    private static readonly Dictionary<ServicePaymentStatus, string> PaymentStatusNames = new()
    {
        [ServicePaymentStatus.Odenmedi] = "Ödenmedi",
        [ServicePaymentStatus.KismiOdendi] = "Kısmi Ödendi",
        [ServicePaymentStatus.Odendi] = "Ödendi",
    };

    private static readonly Dictionary<ServicePriority, string> PriorityNames = new()
    {
        [ServicePriority.Dusuk] = "Düşük",
        [ServicePriority.Orta] = "Orta",
        [ServicePriority.Yuksek] = "Yüksek",
    };

    // ── Liste ──
    public async Task<Result<PagedResult<ServiceListDto>>> GetAllAsync(ServiceListFilter filter, int storeId)
    {
        var query = _context.ServiceRecords
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.AssignedUser)
            .Where(s => s.StoreId == storeId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(s =>
                s.ServiceNumber.ToLower().Contains(search) ||
                s.DeviceName.ToLower().Contains(search) ||
                s.Customer.FullName.ToLower().Contains(search) ||
                (s.Customer.Phone != null && s.Customer.Phone.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(filter.Status) && Enum.TryParse<ServiceStatus>(filter.Status, out var status))
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrWhiteSpace(filter.Priority) && Enum.TryParse<ServicePriority>(filter.Priority, out var priority))
            query = query.Where(s => s.Priority == priority);

        if (filter.CustomerId.HasValue)
            query = query.Where(s => s.CustomerId == filter.CustomerId.Value);

        if (filter.AssignedUserId.HasValue)
            query = query.Where(s => s.AssignedUserId == filter.AssignedUserId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new ServiceListDto
            {
                Id = s.Id,
                ServiceNumber = s.ServiceNumber,
                CustomerName = s.Customer.FullName,
                CustomerPhone = s.Customer.Phone,
                DeviceName = s.DeviceName,
                DeviceBrand = s.DeviceBrand,
                DeviceModel = s.DeviceModel,
                FaultDescription = s.FaultDescription,
                Status = s.Status.ToString(),
                StatusName = "", // populated below
                Priority = s.Priority.ToString(),
                PriorityName = "", // populated below
                AssignedUserName = s.AssignedUser != null ? s.AssignedUser.FullName : null,
                TotalCost = s.TotalCost,
                PaymentStatusName = s.PaymentStatus.ToString(), // raw enum string, mapped below
                EstimatedCompletionDate = s.EstimatedCompletionDate,
                DeliveredDate = s.DeliveredDate,
                CreatedAt = s.CreatedAt,
            })
            .ToListAsync();

        // EF Core cannot translate Dictionary lookups in LINQ — map names in memory
        foreach (var item in items)
        {
            if (Enum.TryParse<ServiceStatus>(item.Status, out var st))
                item.StatusName = StatusNames.GetValueOrDefault(st, item.Status);
            if (Enum.TryParse<ServicePriority>(item.Priority, out var pr))
                item.PriorityName = PriorityNames.GetValueOrDefault(pr, item.Priority);
            if (Enum.TryParse<ServicePaymentStatus>(item.PaymentStatusName, out var ps))
                item.PaymentStatusName = PaymentStatusNames.GetValueOrDefault(ps, item.PaymentStatusName);
        }

        return Result<PagedResult<ServiceListDto>>.Ok(
            PagedResult<ServiceListDto>.Create(items, totalCount, filter.Page, filter.PageSize));
    }

    // ── Özet ──
    public async Task<Result<ServiceSummaryDto>> GetSummaryAsync(int storeId)
    {
        var records = await _context.ServiceRecords
            .AsNoTracking()
            .Where(s => s.StoreId == storeId)
            .Select(s => new { s.Status, s.PaymentStatus, s.TotalCost, s.PaidAmount })
            .ToListAsync();

        return Result<ServiceSummaryDto>.Ok(new ServiceSummaryDto
        {
            TotalCount = records.Count,
            KayitAcildiCount = records.Count(r => r.Status == ServiceStatus.KayitAcildi),
            IncelemedeCount = records.Count(r => r.Status == ServiceStatus.Incelemede),
            OnayBekliyorCount = records.Count(r => r.Status == ServiceStatus.OnayBekliyor),
            ParcaBekliyorCount = records.Count(r => r.Status == ServiceStatus.ParcaBekliyor),
            IslemdeCount = records.Count(r => r.Status == ServiceStatus.Islemde),
            TamamlandiCount = records.Count(r => r.Status == ServiceStatus.Tamamlandi),
            TeslimEdildiCount = records.Count(r => r.Status == ServiceStatus.TeslimEdildi),
            IptalEdildiCount = records.Count(r => r.Status == ServiceStatus.IptalEdildi),
            BorcluCount = records.Count(r => r.TotalCost > 0 && r.PaidAmount < r.TotalCost && r.PaymentStatus != ServicePaymentStatus.Odendi),
        });
    }

    // ── Detay ──
    public async Task<Result<ServiceRecordDto>> GetByIdAsync(int id, int storeId)
    {
        var record = await _context.ServiceRecords
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.AssignedUser)
            .Include(s => s.ReceivedByUser)
            .Include(s => s.Logs).ThenInclude(l => l.User)
            .Include(s => s.Parts).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (record is null)
            return Result<ServiceRecordDto>.Fail("Servis kaydı bulunamadı.");

        return Result<ServiceRecordDto>.Ok(MapToDto(record));
    }

    // ── Oluştur ──
    public async Task<Result<ServiceRecordDto>> CreateAsync(CreateServiceRequest request, int storeId, int userId)
    {
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Id == request.CustomerId && c.StoreId == storeId && c.IsActive);

        if (customer is null)
            return Result<ServiceRecordDto>.Fail("Müşteri bulunamadı.");

        if (request.AssignedUserId.HasValue)
        {
            var techExists = await _context.Users.AnyAsync(u => u.Id == request.AssignedUserId.Value && u.StoreId == storeId && u.IsActive);
            if (!techExists)
                return Result<ServiceRecordDto>.Fail("Atanan teknisyen bulunamadı.");
        }

        var serviceNumber = await GenerateServiceNumber(storeId);

        var record = new ServiceRecord
        {
            StoreId = storeId,
            CustomerId = request.CustomerId,
            AssignedUserId = request.AssignedUserId,
            ReceivedByUserId = userId,
            ServiceNumber = serviceNumber,
            DeviceName = request.DeviceName,
            DeviceBrand = request.DeviceBrand,
            DeviceModel = request.DeviceModel,
            DeviceSerial = request.DeviceSerial,
            DeviceAccessories = request.DeviceAccessories,
            DeviceCondition = request.DeviceCondition,
            FaultDescription = request.FaultDescription,
            CustomerNote = request.CustomerNote,
            EstimatedCompletionDate = request.EstimatedCompletionDate,
            Status = ServiceStatus.KayitAcildi,
            Priority = Enum.TryParse<ServicePriority>(request.Priority, out var prio) ? prio : ServicePriority.Dusuk,
        };

        record.Logs.Add(new ServiceLog
        {
            UserId = userId,
            NewStatus = ServiceStatus.KayitAcildi,
            Description = "Servis kaydı açıldı.",
            IsInternal = false,
        });

        _context.ServiceRecords.Add(record);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(record.Id, storeId);
    }

    // ── Güncelle ──
    public async Task<Result<ServiceRecordDto>> UpdateAsync(int id, UpdateServiceRequest request, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (record is null)
            return Result<ServiceRecordDto>.Fail("Servis kaydı bulunamadı.");

        if (record.Status == ServiceStatus.TeslimEdildi || record.Status == ServiceStatus.IptalEdildi)
            return Result<ServiceRecordDto>.Fail("Teslim edilen veya iptal edilen servis kaydı düzenlenemez.");

        record.AssignedUserId = request.AssignedUserId;
        record.DeviceName = request.DeviceName;
        record.DeviceBrand = request.DeviceBrand;
        record.DeviceModel = request.DeviceModel;
        record.DeviceSerial = request.DeviceSerial;
        record.DeviceAccessories = request.DeviceAccessories;
        record.DeviceCondition = request.DeviceCondition;
        record.FaultDescription = request.FaultDescription;
        record.CustomerNote = request.CustomerNote;
        record.EstimatedCompletionDate = request.EstimatedCompletionDate;
        record.LaborCost = request.LaborCost;
        if (Enum.TryParse<ServicePriority>(request.Priority, out var prio))
            record.Priority = prio;

        RecalculateTotalCost(record);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(record.Id, storeId);
    }

    // ── Durum Güncelle ──
    public async Task<Result<ServiceRecordDto>> UpdateStatusAsync(int id, UpdateServiceStatusRequest request, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (record is null)
            return Result<ServiceRecordDto>.Fail("Servis kaydı bulunamadı.");

        if (!Enum.TryParse<ServiceStatus>(request.Status, out var newStatus))
            return Result<ServiceRecordDto>.Fail("Geçersiz durum değeri.");

        var oldStatus = record.Status;
        record.Status = newStatus;

        if (newStatus == ServiceStatus.Tamamlandi)
            record.CompletedDate = DateTime.UtcNow;

        if (newStatus == ServiceStatus.TeslimEdildi)
            record.DeliveredDate = DateTime.UtcNow;

        _context.ServiceLogs.Add(new ServiceLog
        {
            ServiceRecordId = record.Id,
            UserId = userId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Description = request.Note ?? $"Durum güncellendi: {StatusNames.GetValueOrDefault(oldStatus)} → {StatusNames.GetValueOrDefault(newStatus)}",
            IsInternal = request.IsInternal,
        });

        await _context.SaveChangesAsync();

        return await GetByIdAsync(record.Id, storeId);
    }

    // ── Öncelik Güncelle ──
    public async Task<Result<ServiceRecordDto>> UpdatePriorityAsync(int id, UpdateServicePriorityRequest request, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (record is null)
            return Result<ServiceRecordDto>.Fail("Servis kaydı bulunamadı.");

        if (!Enum.TryParse<ServicePriority>(request.Priority, out var newPriority))
            return Result<ServiceRecordDto>.Fail("Geçersiz öncelik değeri.");

        var oldPriority = record.Priority;
        record.Priority = newPriority;

        _context.ServiceLogs.Add(new ServiceLog
        {
            ServiceRecordId = record.Id,
            UserId = userId,
            Description = $"Öncelik güncellendi: {PriorityNames.GetValueOrDefault(oldPriority)} → {PriorityNames.GetValueOrDefault(newPriority)}",
            IsInternal = true,
        });

        await _context.SaveChangesAsync();

        return await GetByIdAsync(record.Id, storeId);
    }

    // ── Parça Ekle ──
    public async Task<Result<ServicePartDto>> AddPartAsync(int serviceId, AddServicePartRequest request, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .Include(s => s.Parts)
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.StoreId == storeId);

        if (record is null)
            return Result<ServicePartDto>.Fail("Servis kaydı bulunamadı.");

        if (record.Status == ServiceStatus.TeslimEdildi || record.Status == ServiceStatus.IptalEdildi)
            return Result<ServicePartDto>.Fail("Teslim edilen veya iptal edilen servise parça eklenemez.");

        var part = new ServicePart
        {
            ServiceRecordId = serviceId,
            UserId = userId,
            PartName = request.PartName,
            Quantity = request.Quantity,
            UnitCost = request.UnitCost,
            TotalCost = Math.Round(request.UnitCost * request.Quantity, 2),
        };

        // Stoktan düş
        if (request.ProductId.HasValue)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == request.ProductId.Value && p.StoreId == storeId && p.IsActive);

            if (product is null)
                return Result<ServicePartDto>.Fail("Stok ürünü bulunamadı.");

            if (product.StockQuantity < request.Quantity)
                return Result<ServicePartDto>.Fail($"Yetersiz stok. Mevcut: {product.StockQuantity}");

            product.StockQuantity -= request.Quantity;
            part.ProductId = product.Id;
            part.DeductedFromStock = true;

            _context.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id,
                UserId = userId,
                Type = MovementType.Servis,
                Quantity = -request.Quantity,
                StockAfter = product.StockQuantity,
                Note = $"Servis: {record.ServiceNumber}",
            });
        }

        record.Parts.Add(part);
        record.PartsCost = record.Parts.Sum(p => p.TotalCost) + part.TotalCost;
        RecalculateTotalCost(record);

        // Log ekle
        _context.ServiceLogs.Add(new ServiceLog
        {
            ServiceRecordId = serviceId,
            UserId = userId,
            Description = $"Parça eklendi: {request.PartName} x{request.Quantity}",
            IsInternal = true,
        });

        await _context.SaveChangesAsync();

        var user = await _context.Users.AsNoTracking().FirstAsync(u => u.Id == userId);

        return Result<ServicePartDto>.Ok(new ServicePartDto
        {
            Id = part.Id,
            ProductId = part.ProductId,
            PartName = part.PartName,
            Quantity = part.Quantity,
            UnitCost = part.UnitCost,
            TotalCost = part.TotalCost,
            DeductedFromStock = part.DeductedFromStock,
            AddedByUserName = user.FullName,
            CreatedAt = part.CreatedAt,
        });
    }

    // ── Parça Sil ──
    public async Task<Result> RemovePartAsync(int serviceId, int partId, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .Include(s => s.Parts)
            .FirstOrDefaultAsync(s => s.Id == serviceId && s.StoreId == storeId);

        if (record is null)
            return Result.Fail("Servis kaydı bulunamadı.");

        var part = record.Parts.FirstOrDefault(p => p.Id == partId);
        if (part is null)
            return Result.Fail("Parça bulunamadı.");

        // Stoku geri ekle
        if (part.DeductedFromStock && part.ProductId.HasValue)
        {
            var product = await _context.Products.FindAsync(part.ProductId.Value);
            if (product is not null)
            {
                product.StockQuantity += part.Quantity;
                _context.StockMovements.Add(new StockMovement
                {
                    ProductId = product.Id,
                    UserId = userId,
                    Type = MovementType.Servis,
                    Quantity = part.Quantity,
                    StockAfter = product.StockQuantity,
                    Note = $"Servis parça iptali: {record.ServiceNumber}",
                });
            }
        }

        _context.ServiceParts.Remove(part);
        record.PartsCost = record.Parts.Where(p => p.Id != partId).Sum(p => p.TotalCost);
        RecalculateTotalCost(record);

        _context.ServiceLogs.Add(new ServiceLog
        {
            ServiceRecordId = serviceId,
            UserId = userId,
            Description = $"Parça silindi: {part.PartName} x{part.Quantity}",
            IsInternal = true,
        });

        await _context.SaveChangesAsync();
        return Result.Ok("Parça silindi.");
    }

    // ── Ödeme Ekle ──
    public async Task<Result<ServiceRecordDto>> AddPaymentAsync(int id, AddServicePaymentRequest request, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (record is null)
            return Result<ServiceRecordDto>.Fail("Servis kaydı bulunamadı.");

        record.PaidAmount += request.Amount;

        if (record.PaidAmount >= record.TotalCost)
            record.PaymentStatus = ServicePaymentStatus.Odendi;
        else if (record.PaidAmount > 0)
            record.PaymentStatus = ServicePaymentStatus.KismiOdendi;

        _context.ServiceLogs.Add(new ServiceLog
        {
            ServiceRecordId = id,
            UserId = userId,
            Description = $"Ödeme alındı: ₺{request.Amount:N2}" + (request.Note != null ? $" — {request.Note}" : ""),
            IsInternal = false,
        });

        await _context.SaveChangesAsync();
        return await GetByIdAsync(record.Id, storeId);
    }

    // ── Not Ekle ──
    public async Task<Result<ServiceLogDto>> AddLogAsync(int serviceId, AddServiceLogRequest request, int storeId, int userId)
    {
        var exists = await _context.ServiceRecords.AnyAsync(s => s.Id == serviceId && s.StoreId == storeId);
        if (!exists)
            return Result<ServiceLogDto>.Fail("Servis kaydı bulunamadı.");

        var log = new ServiceLog
        {
            ServiceRecordId = serviceId,
            UserId = userId,
            Description = request.Description,
            IsInternal = request.IsInternal,
        };

        _context.ServiceLogs.Add(log);
        await _context.SaveChangesAsync();

        var user = await _context.Users.AsNoTracking().FirstAsync(u => u.Id == userId);

        return Result<ServiceLogDto>.Ok(new ServiceLogDto
        {
            Id = log.Id,
            UserName = user.FullName,
            Description = log.Description,
            IsInternal = log.IsInternal,
            CreatedAt = log.CreatedAt,
        });
    }

    // ── Müşteri Takip: Servis Numarası ──
    public async Task<Result<ServiceTrackingDto>> TrackByNumberAsync(string serviceNumber)
    {
        var record = await _context.ServiceRecords
            .AsNoTracking()
            .Include(s => s.Logs.Where(l => !l.IsInternal)).ThenInclude(l => l.User)
            .Include(s => s.Parts)
            .FirstOrDefaultAsync(s => s.ServiceNumber == serviceNumber);

        if (record is null)
            return Result<ServiceTrackingDto>.Fail("Servis kaydı bulunamadı.");

        return Result<ServiceTrackingDto>.Ok(MapToTrackingDto(record));
    }

    // ── Müşteri Takip: Telefon ──
    public async Task<Result<List<ServiceTrackingDto>>> TrackByPhoneAsync(string phone)
    {
        var records = await _context.ServiceRecords
            .AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Logs.Where(l => !l.IsInternal))
            .Include(s => s.Parts)
            .Where(s => s.Customer.Phone == phone)
            .OrderByDescending(s => s.CreatedAt)
            .Take(20)
            .ToListAsync();

        if (records.Count == 0)
            return Result<List<ServiceTrackingDto>>.Fail("Bu telefon numarasına ait servis kaydı bulunamadı.");

        return Result<List<ServiceTrackingDto>>.Ok(records.Select(MapToTrackingDto).ToList());
    }

    public async Task<Result> DeleteAsync(int id, int storeId, int userId)
    {
        var record = await _context.ServiceRecords
            .Include(s => s.Logs)
            .Include(s => s.Parts)
            .FirstOrDefaultAsync(s => s.Id == id && s.StoreId == storeId);

        if (record == null)
            return Result.Fail("Servis kaydı bulunamadı.");

        _context.ServiceRecords.Remove(record);
        await _context.SaveChangesAsync();

        return Result.Ok("Servis kaydı başarıyla silindi.");
    }

    // ── Yardımcılar ──

    private async Task<string> GenerateServiceNumber(int storeId)
    {
        var prefix = $"SRV-{storeId:D2}-";
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var fullPrefix = $"{prefix}{today}-";

        var lastNumber = await _context.ServiceRecords
            .Where(s => s.StoreId == storeId && s.ServiceNumber.StartsWith(fullPrefix))
            .OrderByDescending(s => s.ServiceNumber)
            .Select(s => s.ServiceNumber)
            .FirstOrDefaultAsync();

        var seq = 1;
        if (lastNumber != null)
        {
            var parts = lastNumber.Split('-');
            if (parts.Length > 0 && int.TryParse(parts[^1], out var lastSeq))
                seq = lastSeq + 1;
        }

        return $"{fullPrefix}{seq:D4}";
    }

    private static void RecalculateTotalCost(ServiceRecord record)
    {
        record.TotalCost = record.LaborCost + record.PartsCost;
    }

    private ServiceRecordDto MapToDto(ServiceRecord s)
    {
        return new ServiceRecordDto
        {
            Id = s.Id,
            ServiceNumber = s.ServiceNumber,
            CustomerId = s.CustomerId,
            CustomerName = s.Customer.FullName,
            CustomerPhone = s.Customer.Phone,
            AssignedUserId = s.AssignedUserId,
            AssignedUserName = s.AssignedUser?.FullName,
            ReceivedByUserName = s.ReceivedByUser.FullName,
            DeviceName = s.DeviceName,
            DeviceBrand = s.DeviceBrand,
            DeviceModel = s.DeviceModel,
            DeviceSerial = s.DeviceSerial,
            DeviceAccessories = s.DeviceAccessories,
            DeviceCondition = s.DeviceCondition,
            FaultDescription = s.FaultDescription,
            CustomerNote = s.CustomerNote,
            Status = s.Status.ToString(),
            StatusName = StatusNames.GetValueOrDefault(s.Status, s.Status.ToString()),
            Priority = s.Priority.ToString(),
            PriorityName = PriorityNames.GetValueOrDefault(s.Priority, s.Priority.ToString()),
            EstimatedCompletionDate = s.EstimatedCompletionDate,
            CompletedDate = s.CompletedDate,
            DeliveredDate = s.DeliveredDate,
            LaborCost = s.LaborCost,
            PartsCost = s.PartsCost,
            TotalCost = s.TotalCost,
            PaidAmount = s.PaidAmount,
            PaymentStatus = s.PaymentStatus.ToString(),
            PaymentStatusName = PaymentStatusNames.GetValueOrDefault(s.PaymentStatus, s.PaymentStatus.ToString()),
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
            Logs = s.Logs.OrderByDescending(l => l.CreatedAt).Select(l => new ServiceLogDto
            {
                Id = l.Id,
                UserName = l.User.FullName,
                OldStatusName = l.OldStatus.HasValue ? StatusNames.GetValueOrDefault(l.OldStatus.Value) : null,
                NewStatusName = l.NewStatus.HasValue ? StatusNames.GetValueOrDefault(l.NewStatus.Value) : null,
                Description = l.Description,
                IsInternal = l.IsInternal,
                CreatedAt = l.CreatedAt,
            }).ToList(),
            Parts = s.Parts.OrderByDescending(p => p.CreatedAt).Select(p => new ServicePartDto
            {
                Id = p.Id,
                ProductId = p.ProductId,
                PartName = p.PartName,
                Quantity = p.Quantity,
                UnitCost = p.UnitCost,
                TotalCost = p.TotalCost,
                DeductedFromStock = p.DeductedFromStock,
                AddedByUserName = p.User.FullName,
                CreatedAt = p.CreatedAt,
            }).ToList(),
        };
    }

    private static ServiceTrackingDto MapToTrackingDto(ServiceRecord s)
    {
        return new ServiceTrackingDto
        {
            ServiceNumber = s.ServiceNumber,
            DeviceName = s.DeviceName,
            DeviceBrand = s.DeviceBrand,
            DeviceModel = s.DeviceModel,
            FaultDescription = s.FaultDescription,
            StatusName = StatusNames.GetValueOrDefault(s.Status, s.Status.ToString()),
            EstimatedCompletionDate = s.EstimatedCompletionDate,
            CompletedDate = s.CompletedDate,
            DeliveredDate = s.DeliveredDate,
            TotalCost = s.TotalCost,
            PaidAmount = s.PaidAmount,
            PaymentStatusName = PaymentStatusNames.GetValueOrDefault(s.PaymentStatus, s.PaymentStatus.ToString()),
            CreatedAt = s.CreatedAt,
            Logs = s.Logs.Where(l => !l.IsInternal).OrderByDescending(l => l.CreatedAt).Select(l => new ServiceTrackingLogDto
            {
                StatusName = l.NewStatus.HasValue ? StatusNames.GetValueOrDefault(l.NewStatus.Value) : null,
                Description = l.Description,
                CreatedAt = l.CreatedAt,
            }).ToList(),
            Parts = s.Parts.Select(p => new ServiceTrackingPartDto
            {
                PartName = p.PartName,
                Quantity = p.Quantity,
                TotalCost = p.TotalCost,
            }).ToList(),
        };
    }
}
