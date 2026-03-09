namespace BarcodePos.Application.DTOs.Reports;

public class DailySalesReportDto
{
    public DateTime Date { get; set; }
    public decimal TotalSales { get; set; }
    public int SaleCount { get; set; }
    public decimal CashTotal { get; set; }
    public decimal CardTotal { get; set; }
    public decimal CreditTotal { get; set; }
    public int CancelCount { get; set; }
    public int ReturnCount { get; set; }
}

public class PeriodSalesReportDto
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public List<DailyBreakdownDto> DailyBreakdown { get; set; } = [];
    public decimal TotalSales { get; set; }
    public int TotalSaleCount { get; set; }
}

public class DailyBreakdownDto
{
    public DateTime Date { get; set; }
    public int SaleCount { get; set; }
    public decimal Total { get; set; }
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalProfit { get; set; }
}

public class LowStockReportDto
{
    public int ProductId { get; set; }
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinStockLevel { get; set; }
    public int Deficit { get; set; }
}

public class ProfitReportDto
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalCost { get; set; }
    public decimal GrossProfit { get; set; }
    public decimal GrossProfitMargin { get; set; }
    public int TotalItemsSold { get; set; }
    public List<DailyProfitDto> DailyBreakdown { get; set; } = [];
    public List<CategoryProfitDto> CategoryBreakdown { get; set; } = [];
    public List<ProductProfitDto> TopProfitProducts { get; set; } = [];
}

public class DailyProfitDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal Profit { get; set; }
    public int SaleCount { get; set; }
}

public class CategoryProfitDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMargin { get; set; }
    public int ItemsSold { get; set; }
}

public class ProductProfitDto
{
    public string Barcode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
    public decimal Cost { get; set; }
    public decimal Profit { get; set; }
    public decimal ProfitMargin { get; set; }
}

public class PaymentSummaryDto
{
    public string PaymentType { get; set; } = string.Empty;
    public string PaymentTypeName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Total { get; set; }
    public decimal Percentage { get; set; }
}

public class DashboardSummaryDto
{
    public decimal TodayTotal { get; set; }
    public int TodaySaleCount { get; set; }
    public int LowStockCount { get; set; }
    public decimal TotalCreditBalance { get; set; }
    public decimal YesterdayTotal { get; set; }
    public List<WeeklyTrendDto> WeeklyTrend { get; set; } = [];
    public List<DailyTrendDto> MonthlyTrend { get; set; } = [];
    public List<RecentSaleDto> RecentSales { get; set; } = [];
}

public class WeeklyTrendDto
{
    public DateTime Date { get; set; }
    public string DayName { get; set; } = string.Empty;
    public decimal Total { get; set; }
}

public class DailyTrendDto
{
    public DateTime Date { get; set; }
    public decimal Total { get; set; }
    public int SaleCount { get; set; }
}

public class RecentSaleDto
{
    public int Id { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime SaleDate { get; set; }
    public decimal GrandTotal { get; set; }
    public string PaymentTypeName { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public int ItemCount { get; set; }
    public string ItemsSummary { get; set; } = string.Empty;
}
