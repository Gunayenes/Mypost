using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Reports;

namespace BarcodePos.Application.Interfaces;

public interface IReportService
{
    Task<Result<DailySalesReportDto>> GetDailyReportAsync(DateTime date, int storeId);
    Task<Result<DailyClosingReportDto>> GetDailyClosingReportAsync(DateTime date, int storeId);
    Task<Result<PeriodSalesReportDto>> GetPeriodReportAsync(DateTime from, DateTime to, int storeId);
    Task<Result<List<TopProductDto>>> GetTopProductsAsync(DateTime from, DateTime to, int limit, int storeId);
    Task<Result<List<LowStockReportDto>>> GetLowStockReportAsync(int storeId);
    Task<Result<ProfitReportDto>> GetProfitReportAsync(DateTime from, DateTime to, int storeId);
    Task<Result<List<PaymentSummaryDto>>> GetPaymentSummaryAsync(DateTime from, DateTime to, int storeId);
    Task<Result<DashboardSummaryDto>> GetDashboardSummaryAsync(int storeId);
}
