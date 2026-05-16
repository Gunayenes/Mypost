using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Reports;

namespace BarcodePos.Application.Interfaces;

public interface IReportService
{
    Task<Result<DailySalesReportDto>> GetDailyReportAsync(DateTime date, int storeId);
    /// <param name="dateTo">İsteğe bağlı bitiş tarihi. Verilirse [date, dateTo] aralığı toplanır. null ise sadece o gün.</param>
    Task<Result<DailyClosingReportDto>> GetDailyClosingReportAsync(DateTime date, int storeId, DateTime? dateTo = null);
    Task<Result<PeriodSalesReportDto>> GetPeriodReportAsync(DateTime from, DateTime to, int storeId);
    Task<Result<List<TopProductDto>>> GetTopProductsAsync(DateTime from, DateTime to, int limit, int storeId);
    Task<Result<List<LowStockReportDto>>> GetLowStockReportAsync(int storeId);
    Task<Result<ProfitReportDto>> GetProfitReportAsync(DateTime from, DateTime to, int storeId);
    Task<Result<List<PaymentSummaryDto>>> GetPaymentSummaryAsync(DateTime from, DateTime to, int storeId);
    Task<Result<DashboardSummaryDto>> GetDashboardSummaryAsync(int storeId);
}
