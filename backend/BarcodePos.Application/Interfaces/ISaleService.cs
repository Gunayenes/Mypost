using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Sales;

namespace BarcodePos.Application.Interfaces;

public interface ISaleService
{
    Task<Result<SaleResponseDto>> CreateAsync(CreateSaleRequest request, int storeId, int userId);
    Task<Result<SaleResponseDto>> GetByIdAsync(int id, int storeId);
    Task<Result<PagedResult<SaleListDto>>> GetAllAsync(SaleListFilter filter, int storeId);
    Task<Result<SaleResponseDto>> GetByReceiptNumberAsync(string receiptNumber, int storeId);
    Task<Result> CancelAsync(int id, int storeId);
    Task<Result> ReturnAsync(int id, int storeId, int userId);
}
