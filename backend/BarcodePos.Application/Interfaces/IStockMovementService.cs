using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.StockMovements;

namespace BarcodePos.Application.Interfaces;

public interface IStockMovementService
{
    Task<Result<PagedResult<StockMovementDto>>> GetAllAsync(StockMovementFilter filter, int storeId);
    Task<Result<PagedResult<StockMovementDto>>> GetByProductAsync(int productId, int storeId, int page, int pageSize);
    Task<Result<StockMovementDto>> CreateManualAsync(CreateStockMovementRequest request, int storeId, int userId);
}
