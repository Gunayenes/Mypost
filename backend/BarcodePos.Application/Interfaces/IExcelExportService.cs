namespace BarcodePos.Application.Interfaces;

public interface IExcelExportService
{
    Task<byte[]> ExportSalesAsync(DateTime from, DateTime to, int storeId);
    Task<byte[]> ExportLowStockAsync(int storeId);
    Task<byte[]> ExportTopProductsAsync(DateTime from, DateTime to, int limit, int storeId);
    Task<byte[]> ExportProfitAsync(DateTime from, DateTime to, int storeId);
}
