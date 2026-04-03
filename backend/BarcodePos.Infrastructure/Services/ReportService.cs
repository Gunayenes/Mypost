using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Reports;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DailySalesReportDto>> GetDailyReportAsync(DateTime date, int storeId)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        var sales = await _context.Sales
            .AsNoTracking()
            .Where(s => s.StoreId == storeId && s.SaleDate >= dayStart && s.SaleDate < dayEnd)
            .ToListAsync();

        var completed = sales.Where(s => s.Status == SaleStatus.Tamamlandi).ToList();

        return Result<DailySalesReportDto>.Ok(new DailySalesReportDto
        {
            Date = dayStart,
            TotalSales = completed.Sum(s => s.GrandTotal),
            SaleCount = completed.Count,
            CashTotal = completed.Where(s => s.PaymentType == PaymentType.Nakit).Sum(s => s.GrandTotal),
            CardTotal = completed.Where(s => s.PaymentType == PaymentType.Kart).Sum(s => s.GrandTotal),
            CreditTotal = completed.Where(s => s.PaymentType == PaymentType.Veresiye).Sum(s => s.GrandTotal),
            CancelCount = sales.Count(s => s.Status == SaleStatus.Iptal),
            ReturnCount = sales.Count(s => s.Status == SaleStatus.Iade)
        });
    }

    public async Task<Result<DailyClosingReportDto>> GetDailyClosingReportAsync(DateTime date, int storeId)
    {
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        // Tüm satışları yükle (items + user dahil)
        var allSales = await _context.Sales
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Items).ThenInclude(i => i.Product).ThenInclude(p => p.Category)
            .Where(s => s.StoreId == storeId && s.SaleDate >= dayStart && s.SaleDate < dayEnd)
            .ToListAsync();

        var completed = allSales.Where(s => s.Status == SaleStatus.Tamamlandi).ToList();
        var cancelled = allSales.Where(s => s.Status == SaleStatus.Iptal).ToList();
        var returned = allSales.Where(s => s.Status == SaleStatus.Iade).ToList();

        var cashSales = completed.Where(s => s.PaymentType == PaymentType.Nakit).ToList();
        var cardSales = completed.Where(s => s.PaymentType == PaymentType.Kart).ToList();
        var creditSales = completed.Where(s => s.PaymentType == PaymentType.Veresiye).ToList();

        var completedItems = completed.SelectMany(s => s.Items).ToList();
        var totalItemsSold = completedItems.Sum(i => i.Quantity);
        var grandTotal = completed.Sum(s => s.GrandTotal);
        var totalCost = completedItems.Sum(i => i.CostPrice * i.Quantity);
        var grossProfit = grandTotal - totalCost;

        // Saatlik dağılım (0-23 arası)
        var hourlyBreakdown = Enumerable.Range(0, 24).Select(h =>
        {
            var hourSales = completed.Where(s => s.SaleDate.Hour == h).ToList();
            return new HourlySalesDto
            {
                Hour = h,
                HourLabel = $"{h:D2}:00",
                SaleCount = hourSales.Count,
                Total = hourSales.Sum(s => s.GrandTotal),
                ItemCount = hourSales.SelectMany(s => s.Items).Sum(i => i.Quantity)
            };
        }).ToList();

        // Kasiyer bazlı kırılım
        var cashierBreakdown = completed
            .GroupBy(s => new { s.UserId, s.User.FullName })
            .Select(g => new CashierSalesDto
            {
                UserId = g.Key.UserId,
                FullName = g.Key.FullName,
                SaleCount = g.Count(),
                Total = g.Sum(s => s.GrandTotal),
                CashTotal = g.Where(s => s.PaymentType == PaymentType.Nakit).Sum(s => s.GrandTotal),
                CardTotal = g.Where(s => s.PaymentType == PaymentType.Kart).Sum(s => s.GrandTotal),
                CreditTotal = g.Where(s => s.PaymentType == PaymentType.Veresiye).Sum(s => s.GrandTotal)
            })
            .OrderByDescending(c => c.Total)
            .ToList();

        // Günün en çok satanları (top 10)
        var topProducts = completedItems
            .GroupBy(i => new { i.ProductId, i.Barcode, i.ProductName, CategoryName = i.Product.Category.Name })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                Barcode = g.Key.Barcode,
                ProductName = g.Key.ProductName,
                CategoryName = g.Key.CategoryName,
                TotalQuantity = g.Sum(i => i.Quantity),
                TotalRevenue = g.Sum(i => i.LineTotal),
                TotalProfit = g.Sum(i => (i.UnitPrice - i.CostPrice) * i.Quantity - i.DiscountAmount)
            })
            .OrderByDescending(p => p.TotalQuantity)
            .Take(10)
            .ToList();

        return Result<DailyClosingReportDto>.Ok(new DailyClosingReportDto
        {
            Date = dayStart,
            GrandTotal = grandTotal,
            SubTotal = completed.Sum(s => s.SubTotal),
            TaxTotal = completed.Sum(s => s.TaxTotal),
            DiscountTotal = completed.Sum(s => s.DiscountTotal),
            SaleCount = completed.Count,
            TotalItemsSold = totalItemsSold,
            AverageBasket = completed.Count > 0 ? Math.Round(grandTotal / completed.Count, 2) : 0,
            CashTotal = cashSales.Sum(s => s.GrandTotal),
            CashCount = cashSales.Count,
            CardTotal = cardSales.Sum(s => s.GrandTotal),
            CardCount = cardSales.Count,
            CreditTotal = creditSales.Sum(s => s.GrandTotal),
            CreditCount = creditSales.Count,
            CancelCount = cancelled.Count,
            CancelTotal = cancelled.Sum(s => s.GrandTotal),
            ReturnCount = returned.Count,
            ReturnTotal = returned.Sum(s => s.GrandTotal),
            TotalCost = totalCost,
            GrossProfit = grossProfit,
            GrossProfitMargin = grandTotal > 0 ? Math.Round(grossProfit / grandTotal * 100, 2) : 0,
            HourlyBreakdown = hourlyBreakdown,
            CashierBreakdown = cashierBreakdown,
            TopProducts = topProducts
        });
    }

    public async Task<Result<PeriodSalesReportDto>> GetPeriodReportAsync(DateTime from, DateTime to, int storeId)
    {
        var dateFrom = from.Date;
        var dateTo = to.Date.AddDays(1);

        var sales = await _context.Sales
            .AsNoTracking()
            .Where(s => s.StoreId == storeId
                     && s.SaleDate >= dateFrom && s.SaleDate < dateTo
                     && s.Status == SaleStatus.Tamamlandi)
            .ToListAsync();

        var daily = sales
            .GroupBy(s => s.SaleDate.Date)
            .Select(g => new DailyBreakdownDto
            {
                Date = g.Key,
                SaleCount = g.Count(),
                Total = g.Sum(s => s.GrandTotal)
            })
            .OrderBy(d => d.Date)
            .ToList();

        return Result<PeriodSalesReportDto>.Ok(new PeriodSalesReportDto
        {
            DateFrom = dateFrom,
            DateTo = to.Date,
            DailyBreakdown = daily,
            TotalSales = sales.Sum(s => s.GrandTotal),
            TotalSaleCount = sales.Count
        });
    }

    public async Task<Result<List<TopProductDto>>> GetTopProductsAsync(DateTime from, DateTime to, int limit, int storeId)
    {
        var dateFrom = from.Date;
        var dateTo = to.Date.AddDays(1);

        var topProducts = await _context.SaleItems
            .AsNoTracking()
            .Include(si => si.Sale)
            .Include(si => si.Product).ThenInclude(p => p.Category)
            .Where(si => si.Sale.StoreId == storeId
                      && si.Sale.SaleDate >= dateFrom && si.Sale.SaleDate < dateTo
                      && si.Sale.Status == SaleStatus.Tamamlandi)
            .GroupBy(si => new { si.ProductId, si.Product.Barcode, si.ProductName, CategoryName = si.Product.Category.Name })
            .Select(g => new TopProductDto
            {
                ProductId = g.Key.ProductId,
                Barcode = g.Key.Barcode,
                ProductName = g.Key.ProductName,
                CategoryName = g.Key.CategoryName,
                TotalQuantity = g.Sum(si => si.Quantity),
                TotalRevenue = g.Sum(si => si.LineTotal),
                TotalProfit = g.Sum(si => (si.UnitPrice - si.CostPrice) * si.Quantity - si.DiscountAmount)
            })
            .OrderByDescending(p => p.TotalQuantity)
            .Take(limit)
            .ToListAsync();

        return Result<List<TopProductDto>>.Ok(topProducts);
    }

    public async Task<Result<List<LowStockReportDto>>> GetLowStockReportAsync(int storeId)
    {
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Where(p => p.StoreId == storeId && p.IsActive && p.StockQuantity <= p.MinStockLevel)
            .OrderBy(p => p.StockQuantity - p.MinStockLevel)
            .Select(p => new LowStockReportDto
            {
                ProductId = p.Id,
                Barcode = p.Barcode,
                Name = p.Name,
                CategoryName = p.Category.Name,
                StockQuantity = p.StockQuantity,
                MinStockLevel = p.MinStockLevel,
                Deficit = p.MinStockLevel - p.StockQuantity
            })
            .ToListAsync();

        return Result<List<LowStockReportDto>>.Ok(products);
    }

    public async Task<Result<ProfitReportDto>> GetProfitReportAsync(DateTime from, DateTime to, int storeId)
    {
        var dateFrom = from.Date;
        var dateTo = to.Date.AddDays(1);

        var saleItems = await _context.SaleItems
            .AsNoTracking()
            .Include(si => si.Sale)
            .Include(si => si.Product).ThenInclude(p => p.Category)
            .Where(si => si.Sale.StoreId == storeId
                      && si.Sale.SaleDate >= dateFrom && si.Sale.SaleDate < dateTo
                      && si.Sale.Status == SaleStatus.Tamamlandi)
            .ToListAsync();

        var totalRevenue = saleItems.Sum(si => si.LineTotal);
        var totalCost = saleItems.Sum(si => si.CostPrice * si.Quantity);
        var grossProfit = totalRevenue - totalCost;
        var margin = totalRevenue > 0 ? Math.Round(grossProfit / totalRevenue * 100, 2) : 0;

        // Günlük kırılım
        var dailyBreakdown = saleItems
            .GroupBy(si => si.Sale.SaleDate.Date)
            .Select(g =>
            {
                var rev = g.Sum(si => si.LineTotal);
                var cost = g.Sum(si => si.CostPrice * si.Quantity);
                return new DailyProfitDto
                {
                    Date = g.Key,
                    Revenue = rev,
                    Cost = cost,
                    Profit = rev - cost,
                    SaleCount = g.Select(si => si.SaleId).Distinct().Count()
                };
            })
            .OrderBy(d => d.Date)
            .ToList();

        // Kategori bazlı kâr
        var categoryBreakdown = saleItems
            .GroupBy(si => si.Product.Category.Name)
            .Select(g =>
            {
                var rev = g.Sum(si => si.LineTotal);
                var cost = g.Sum(si => si.CostPrice * si.Quantity);
                var profit = rev - cost;
                return new CategoryProfitDto
                {
                    CategoryName = g.Key,
                    Revenue = rev,
                    Cost = cost,
                    Profit = profit,
                    ProfitMargin = rev > 0 ? Math.Round(profit / rev * 100, 2) : 0,
                    ItemsSold = g.Sum(si => si.Quantity)
                };
            })
            .OrderByDescending(c => c.Profit)
            .ToList();

        // En kârlı ürünler (top 15)
        var topProfitProducts = saleItems
            .GroupBy(si => new { si.ProductId, si.Barcode, si.ProductName, CategoryName = si.Product.Category.Name })
            .Select(g =>
            {
                var rev = g.Sum(si => si.LineTotal);
                var cost = g.Sum(si => si.CostPrice * si.Quantity);
                var profit = rev - cost;
                return new ProductProfitDto
                {
                    Barcode = g.Key.Barcode,
                    ProductName = g.Key.ProductName,
                    CategoryName = g.Key.CategoryName,
                    QuantitySold = g.Sum(si => si.Quantity),
                    Revenue = rev,
                    Cost = cost,
                    Profit = profit,
                    ProfitMargin = rev > 0 ? Math.Round(profit / rev * 100, 2) : 0
                };
            })
            .OrderByDescending(p => p.Profit)
            .Take(15)
            .ToList();

        return Result<ProfitReportDto>.Ok(new ProfitReportDto
        {
            DateFrom = dateFrom,
            DateTo = to.Date,
            TotalRevenue = totalRevenue,
            TotalCost = totalCost,
            GrossProfit = grossProfit,
            GrossProfitMargin = margin,
            TotalItemsSold = saleItems.Sum(si => si.Quantity),
            DailyBreakdown = dailyBreakdown,
            CategoryBreakdown = categoryBreakdown,
            TopProfitProducts = topProfitProducts
        });
    }

    public async Task<Result<List<PaymentSummaryDto>>> GetPaymentSummaryAsync(DateTime from, DateTime to, int storeId)
    {
        var dateFrom = from.Date;
        var dateTo = to.Date.AddDays(1);

        var sales = await _context.Sales
            .AsNoTracking()
            .Where(s => s.StoreId == storeId
                     && s.SaleDate >= dateFrom && s.SaleDate < dateTo
                     && s.Status == SaleStatus.Tamamlandi)
            .ToListAsync();

        var overallTotal = sales.Sum(s => s.GrandTotal);

        var summary = sales
            .GroupBy(s => s.PaymentType)
            .Select(g =>
            {
                var total = g.Sum(s => s.GrandTotal);
                return new PaymentSummaryDto
                {
                    PaymentType = g.Key.ToString(),
                    PaymentTypeName = g.Key switch
                    {
                        PaymentType.Nakit => "Nakit",
                        PaymentType.Kart => "Kredi Kartı",
                        PaymentType.Veresiye => "Veresiye",
                        _ => g.Key.ToString()
                    },
                    Count = g.Count(),
                    Total = total,
                    Percentage = overallTotal > 0 ? Math.Round(total / overallTotal * 100, 2) : 0
                };
            })
            .OrderByDescending(s => s.Total)
            .ToList();

        return Result<List<PaymentSummaryDto>>.Ok(summary);
    }

    public async Task<Result<DashboardSummaryDto>> GetDashboardSummaryAsync(int storeId)
    {
        var today = DateTime.UtcNow.Date;
        var yesterday = today.AddDays(-1);
        var weekAgo = today.AddDays(-6);
        var monthAgo = today.AddDays(-29);

        // Bugünün satışları
        var todaySales = await _context.Sales.AsNoTracking()
            .Where(s => s.StoreId == storeId && s.SaleDate >= today && s.SaleDate < today.AddDays(1) && s.Status == SaleStatus.Tamamlandi)
            .ToListAsync();

        // Dünün satışları
        var yesterdayTotal = await _context.Sales.AsNoTracking()
            .Where(s => s.StoreId == storeId && s.SaleDate >= yesterday && s.SaleDate < today && s.Status == SaleStatus.Tamamlandi)
            .SumAsync(s => (decimal?)s.GrandTotal) ?? 0;

        // Düşük stok
        var lowStockCount = await _context.Products.AsNoTracking()
            .CountAsync(p => p.StoreId == storeId && p.IsActive && p.StockQuantity <= p.MinStockLevel);

        // Toplam veresiye bakiye
        var totalCreditBalance = await _context.Customers.AsNoTracking()
            .Where(c => c.StoreId == storeId && c.IsActive)
            .SumAsync(c => (decimal?)c.Balance) ?? 0;

        // 30 günlük tüm satışlar (tek sorgu — haftalık + aylık trend için)
        var monthSales = await _context.Sales.AsNoTracking()
            .Where(s => s.StoreId == storeId && s.SaleDate >= monthAgo && s.SaleDate < today.AddDays(1) && s.Status == SaleStatus.Tamamlandi)
            .ToListAsync();

        // Haftalık trend (son 7 gün)
        var weeklyTrend = Enumerable.Range(0, 7).Select(i =>
        {
            var d = weekAgo.AddDays(i);
            var daySales = monthSales.Where(s => s.SaleDate.Date == d);
            return new WeeklyTrendDto
            {
                Date = d,
                DayName = d.ToString("ddd"),
                Total = daySales.Sum(s => s.GrandTotal)
            };
        }).ToList();

        // 30 günlük trend
        var monthlyTrend = Enumerable.Range(0, 30).Select(i =>
        {
            var d = monthAgo.AddDays(i);
            var daySales = monthSales.Where(s => s.SaleDate.Date == d);
            return new DailyTrendDto
            {
                Date = d,
                Total = daySales.Sum(s => s.GrandTotal),
                SaleCount = daySales.Count()
            };
        }).ToList();

        // Son 10 satış
        var rawRecentSales = await _context.Sales.AsNoTracking()
            .Include(s => s.Customer)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Where(s => s.StoreId == storeId)
            .OrderByDescending(s => s.SaleDate)
            .Take(10)
            .Select(s => new
            {
                s.Id,
                s.ReceiptNumber,
                s.SaleDate,
                s.GrandTotal,
                s.PaymentType,
                s.Status,
                CustomerName = s.Customer != null ? s.Customer.FullName : null,
                ItemNames = s.Items.Select(i => i.Product.Name).ToList()
            })
            .ToListAsync();

        var recentSales = rawRecentSales.Select(s => new RecentSaleDto
        {
            Id = s.Id,
            ReceiptNumber = s.ReceiptNumber,
            SaleDate = s.SaleDate,
            GrandTotal = s.GrandTotal,
            PaymentTypeName = s.PaymentType == PaymentType.Nakit ? "Nakit"
                : s.PaymentType == PaymentType.Kart ? "Kart"
                : s.PaymentType == PaymentType.Veresiye ? "Veresiye" : s.PaymentType.ToString(),
            StatusName = s.Status == SaleStatus.Tamamlandi ? "Tamamlandı"
                : s.Status == SaleStatus.Iptal ? "İptal" : "İade",
            CustomerName = s.CustomerName,
            ItemCount = s.ItemNames.Count,
            ItemsSummary = string.Join(", ", s.ItemNames.Take(3))
                + (s.ItemNames.Count > 3 ? $" +{s.ItemNames.Count - 3}" : "")
        }).ToList();

        return Result<DashboardSummaryDto>.Ok(new DashboardSummaryDto
        {
            TodayTotal = todaySales.Sum(s => s.GrandTotal),
            TodaySaleCount = todaySales.Count,
            LowStockCount = lowStockCount,
            TotalCreditBalance = totalCreditBalance,
            YesterdayTotal = yesterdayTotal,
            WeeklyTrend = weeklyTrend,
            MonthlyTrend = monthlyTrend,
            RecentSales = recentSales
        });
    }
}
