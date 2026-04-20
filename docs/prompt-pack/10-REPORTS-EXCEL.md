# 📈 FAZ 4: Raporlama ve Excel Export

> Önkoşul: Satış modülü (`09-SALES-TRANSACTION.md`) çalışıyor olmalı.

---

```plaintext
Generate the Reports module for the POS backend.

═══════════════════════════════════════
REPORT DTOs
═══════════════════════════════════════

- DailySalesReportDto { Date, TotalSales, SaleCount, CashTotal, CardTotal, CreditTotal, CancelCount, ReturnCount }
- PeriodSalesReportDto { DateFrom, DateTo, DailyBreakdown[], TotalSales, TotalSaleCount }
- DailyBreakdownDto { Date, SaleCount, Total }
- TopProductDto { ProductId, Barcode, ProductName, CategoryName, TotalQuantity, TotalRevenue, TotalProfit }
- LowStockReportDto { ProductId, Barcode, Name, CategoryName, StockQuantity, MinStockLevel, Deficit }
- ProfitReportDto { DateFrom, DateTo, TotalRevenue, TotalCost, GrossProfit, GrossProfitMargin }
- PaymentSummaryDto { PaymentType, PaymentTypeName, Count, Total, Percentage }
- DashboardSummaryDto { TodayTotal, TodaySaleCount, LowStockCount, TotalCreditBalance, YesterdayTotal, WeeklyTrend[] }
- WeeklyTrendDto { Date, DayName, Total }

═══════════════════════════════════════
ENDPOINTS
═══════════════════════════════════════

- GET /api/reports/daily?date={yyyy-MM-dd}                              → Yonetici+
- GET /api/reports/period?from={date}&to={date}                         → Yonetici+
- GET /api/reports/top-products?from={date}&to={date}&limit={n}         → Yonetici+
- GET /api/reports/low-stock                                            → Yonetici+
- GET /api/reports/profit?from={date}&to={date}                         → Admin only
- GET /api/reports/payment-summary?from={date}&to={date}                → Yonetici+
- GET /api/reports/export/excel?type={type}&from={date}&to={date}       → Yonetici+
- GET /api/dashboard/summary                                            → Yonetici+

═══════════════════════════════════════
BUSINESS RULES
═══════════════════════════════════════

General:
- ALL reports filter by current user's StoreId
- Exclude canceled sales (Status != Iptal) from totals
- Returned sales should be subtracted or shown separately

Daily report:
- Group completed sales by date
- Break down by payment type
- Show cancel and return counts

Period report:
- Daily breakdown within date range
- Running totals

Top products:
- Use SaleItem data from completed sales
- Sort by TotalQuantity descending
- Limit by parameter (default 10)
- TotalProfit = sum of ((UnitPrice - CostPrice) * Quantity - DiscountAmount)

Profit report (Admin only):
- TotalRevenue = sum of SaleItem.LineTotal for completed sales
- TotalCost = sum of (SaleItem.CostPrice * SaleItem.Quantity) for completed sales
- GrossProfit = TotalRevenue - TotalCost
- GrossProfitMargin = (GrossProfit / TotalRevenue) * 100

Payment summary:
- Group by PaymentType
- Count and total per type
- Calculate percentage of total

Dashboard:
- Today's total and sale count
- Low stock product count
- Total credit balance across all customers
- Yesterday's total for comparison
- Last 7 days trend for chart

═══════════════════════════════════════
EXCEL EXPORT (ClosedXML)
═══════════════════════════════════════

Supported export types:
- "sales" → sales summary for date range
- "low-stock" → low stock report
- "top-products" → top selling products
- "profit" → profit report (Admin only)

Excel requirements:
- Use ClosedXML library
- Generate .xlsx file
- Return as FileContentResult with proper content type
- Include:
  - Header row with bold formatting
  - Column auto-fit
  - Title row with report name and date range
  - Proper number formatting for currency columns
  - Sheet name matching report type

Example workbook structure for "sales" export:
  - Sheet: "Satış Raporu"
  - Row 1: "Satış Raporu — {from} - {to}" (merged, bold)
  - Row 3: Headers (Tarih | Satış Adedi | Toplam | Nakit | Kart | Veresiye)
  - Row 4+: Data rows
  - Last row: Totals (bold)

Output:
1. Application layer: DTOs, IReportService, IExcelExportService
2. Infrastructure layer: ReportService, ExcelExportService implementations
3. API layer: ReportsController, DashboardController
4. Excel generation code with ClosedXML
5. Example response JSON for each endpoint
6. NuGet package: ClosedXML
7. Build verification notes
```
