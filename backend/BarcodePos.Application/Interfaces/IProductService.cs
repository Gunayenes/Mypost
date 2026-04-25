using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Products;

namespace BarcodePos.Application.Interfaces;

public interface IProductService
{
    Task<Result<PagedResult<ProductDto>>> GetAllAsync(ProductListFilter filter, int storeId);
    Task<Result<ProductDto>> GetByIdAsync(int id, int storeId);
    Task<Result<ProductDto>> GetByBarcodeAsync(string barcode, int storeId);
    Task<Result<List<ProductDto>>> SearchAsync(string query, int storeId);
    Task<Result<List<LowStockProductDto>>> GetLowStockAsync(int storeId);
    Task<Result<string>> GenerateBarcodeAsync(int storeId);
    Task<Result<ProductDto>> CreateAsync(CreateProductRequest request, int storeId);
    Task<Result<ProductDto>> UpdateAsync(int id, UpdateProductRequest request, int storeId);
    Task<Result> DeleteAsync(int id, int storeId);
    Task<Result<BulkImportResultDto>> BulkImportAsync(Stream excelStream, int storeId);
    Task<byte[]> GetImportTemplateAsync();
    Task<byte[]> ExportToExcelAsync(int storeId);
    /// <summary>USD'li tüm ürünlerin TL fiyatlarını güncel kura göre yeniden hesaplar ve kaydeder.</summary>
    Task<Result<BulkUsdUpdateResult>> BulkUpdateUsdPricesAsync(int storeId);
}

public class BulkUsdUpdateResult
{
    public int UpdatedCount { get; set; }
    public decimal NewExchangeRate { get; set; }
    public DateTime UpdatedAt { get; set; }
}
