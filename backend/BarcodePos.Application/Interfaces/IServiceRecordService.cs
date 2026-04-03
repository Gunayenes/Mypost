using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Services;

namespace BarcodePos.Application.Interfaces;

public interface IServiceRecordService
{
    Task<Result<PagedResult<ServiceListDto>>> GetAllAsync(ServiceListFilter filter, int storeId);
    Task<Result<ServiceSummaryDto>> GetSummaryAsync(int storeId);
    Task<Result<ServiceRecordDto>> GetByIdAsync(int id, int storeId);
    Task<Result<ServiceRecordDto>> CreateAsync(CreateServiceRequest request, int storeId, int userId);
    Task<Result<ServiceRecordDto>> UpdateAsync(int id, UpdateServiceRequest request, int storeId, int userId);
    Task<Result<ServiceRecordDto>> UpdateStatusAsync(int id, UpdateServiceStatusRequest request, int storeId, int userId);
    Task<Result<ServiceRecordDto>> UpdatePriorityAsync(int id, UpdateServicePriorityRequest request, int storeId, int userId);
    Task<Result<ServicePartDto>> AddPartAsync(int serviceId, AddServicePartRequest request, int storeId, int userId);
    Task<Result> RemovePartAsync(int serviceId, int partId, int storeId, int userId);
    Task<Result<ServiceRecordDto>> AddPaymentAsync(int id, AddServicePaymentRequest request, int storeId, int userId);
    Task<Result<ServiceLogDto>> AddLogAsync(int serviceId, AddServiceLogRequest request, int storeId, int userId);
    Task<Result> DeleteAsync(int id, int storeId, int userId);

    // Müşteri takip (dış sorgu — authentication gerektirmez)
    Task<Result<ServiceTrackingDto>> TrackByNumberAsync(string serviceNumber);
    Task<Result<List<ServiceTrackingDto>>> TrackByPhoneAsync(string phone);
}
