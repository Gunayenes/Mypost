using BarcodePos.Application.Interfaces;
using ClosedXML.Excel;

namespace BarcodePos.Infrastructure.Services;

public class ExcelExportService : IExcelExportService
{
    private readonly IReportService _reportService;

    public ExcelExportService(IReportService reportService)
    {
        _reportService = reportService;
    }

    public async Task<byte[]> ExportSalesAsync(DateTime from, DateTime to, int storeId)
    {
        var result = await _reportService.GetPeriodReportAsync(from, to, storeId);
        var data = result.Data!;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Satış Raporu");

        // Başlık
        ws.Cell(1, 1).Value = $"Satış Raporu — {from:dd.MM.yyyy} - {to:dd.MM.yyyy}";
        ws.Range(1, 1, 1, 4).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        // Özet
        ws.Cell(2, 1).Value = $"Toplam Satış: {data.TotalSaleCount} adet, {data.TotalSales:N2} TL";

        // Tablo başlıkları
        var headers = new[] { "Tarih", "Satış Adedi", "Toplam (TL)" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(4, i + 1).Value = headers[i];
            ws.Cell(4, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        // Veri satırları
        var row = 5;
        foreach (var day in data.DailyBreakdown)
        {
            ws.Cell(row, 1).Value = day.Date.ToString("dd.MM.yyyy");
            ws.Cell(row, 2).Value = day.SaleCount;
            ws.Cell(row, 3).Value = day.Total;
            ws.Cell(row, 3).Style.NumberFormat.Format = "#,##0.00";
            row++;
        }

        // Toplam satırı
        ws.Cell(row, 1).Value = "TOPLAM";
        ws.Cell(row, 1).Style.Font.SetBold(true);
        ws.Cell(row, 2).Value = data.TotalSaleCount;
        ws.Cell(row, 2).Style.Font.SetBold(true);
        ws.Cell(row, 3).Value = data.TotalSales;
        ws.Cell(row, 3).Style.Font.SetBold(true).NumberFormat.Format = "#,##0.00";

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportLowStockAsync(int storeId)
    {
        var result = await _reportService.GetLowStockReportAsync(storeId);
        var data = result.Data!;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Düşük Stok");

        ws.Cell(1, 1).Value = $"Düşük Stok Raporu — {DateTime.UtcNow:dd.MM.yyyy}";
        ws.Range(1, 1, 1, 6).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var headers = new[] { "Barkod", "Ürün Adı", "Kategori", "Stok", "Min Stok", "Eksik" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(3, i + 1).Value = headers[i];
            ws.Cell(3, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        var row = 4;
        foreach (var item in data)
        {
            ws.Cell(row, 1).Value = item.Barcode;
            ws.Cell(row, 2).Value = item.Name;
            ws.Cell(row, 3).Value = item.CategoryName;
            ws.Cell(row, 4).Value = item.StockQuantity;
            ws.Cell(row, 5).Value = item.MinStockLevel;
            ws.Cell(row, 6).Value = item.Deficit;
            row++;
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportTopProductsAsync(DateTime from, DateTime to, int limit, int storeId)
    {
        var result = await _reportService.GetTopProductsAsync(from, to, limit, storeId);
        var data = result.Data!;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("En Çok Satanlar");

        ws.Cell(1, 1).Value = $"En Çok Satan Ürünler — {from:dd.MM.yyyy} - {to:dd.MM.yyyy}";
        ws.Range(1, 1, 1, 7).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var headers = new[] { "Barkod", "Ürün", "Kategori", "Miktar", "Gelir (TL)", "Kâr (TL)" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cell(3, i + 1).Value = headers[i];
            ws.Cell(3, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
        }

        var row = 4;
        foreach (var item in data)
        {
            ws.Cell(row, 1).Value = item.Barcode;
            ws.Cell(row, 2).Value = item.ProductName;
            ws.Cell(row, 3).Value = item.CategoryName;
            ws.Cell(row, 4).Value = item.TotalQuantity;
            ws.Cell(row, 5).Value = item.TotalRevenue;
            ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
            ws.Cell(row, 6).Value = item.TotalProfit;
            ws.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
            row++;
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportProfitAsync(DateTime from, DateTime to, int storeId)
    {
        var result = await _reportService.GetProfitReportAsync(from, to, storeId);
        var data = result.Data!;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Kâr Raporu");

        ws.Cell(1, 1).Value = $"Kâr Raporu — {from:dd.MM.yyyy} - {to:dd.MM.yyyy}";
        ws.Range(1, 1, 1, 2).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var row = 3;
        void AddRow(string label, string value) {
            ws.Cell(row, 1).Value = label;
            ws.Cell(row, 1).Style.Font.SetBold(true);
            ws.Cell(row, 2).Value = value;
            row++;
        }

        AddRow("Toplam Gelir:", $"{data.TotalRevenue:N2} TL");
        AddRow("Toplam Maliyet:", $"{data.TotalCost:N2} TL");
        AddRow("Brüt Kâr:", $"{data.GrossProfit:N2} TL");
        AddRow("Kâr Marjı:", $"%{data.GrossProfitMargin:N2}");

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    public async Task<byte[]> ExportDailyClosingAsync(DateTime date, int storeId)
    {
        var result = await _reportService.GetDailyClosingReportAsync(date, storeId);
        var data = result.Data!;

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Gün Sonu Raporu");

        ws.Cell(1, 1).Value = $"Gün Sonu Raporu — {date:dd.MM.yyyy}";
        ws.Range(1, 1, 1, 4).Merge().Style.Font.SetBold(true).Font.SetFontSize(14);

        var row = 3;
        void AddSummaryRow(string label, string value)
        {
            ws.Cell(row, 1).Value = label;
            ws.Cell(row, 1).Style.Font.SetBold(true);
            ws.Cell(row, 2).Value = value;
            row++;
        }

        AddSummaryRow("TOPLAM CİRO:", $"{data.GrandTotal:N2} ₺");
        AddSummaryRow("Ara Toplam (KDV Hariç):", $"{data.SubTotal:N2} ₺");
        AddSummaryRow("KDV Toplamı:", $"{data.TaxTotal:N2} ₺");
        AddSummaryRow("İndirim Toplamı:", $"{data.DiscountTotal:N2} ₺");
        AddSummaryRow("Satış Adedi:", $"{data.SaleCount}");
        AddSummaryRow("Satılan Ürün Adedi:", $"{data.TotalItemsSold}");
        AddSummaryRow("Ortalama Sepet:", $"{data.AverageBasket:N2} ₺");
        row++;
        AddSummaryRow("NAKİT:", $"{data.CashTotal:N2} ₺ ({data.CashCount} işlem)");
        AddSummaryRow("KREDİ KARTI / POS:", $"{data.CardTotal:N2} ₺ ({data.CardCount} işlem)");
        AddSummaryRow("VERESİYE:", $"{data.CreditTotal:N2} ₺ ({data.CreditCount} işlem)");
        row++;
        AddSummaryRow("İptal:", $"{data.CancelTotal:N2} ₺ ({data.CancelCount} adet)");
        AddSummaryRow("İade:", $"{data.ReturnTotal:N2} ₺ ({data.ReturnCount} adet)");
        row++;
        AddSummaryRow("Maliyet:", $"{data.TotalCost:N2} ₺");
        AddSummaryRow("Brüt Kâr:", $"{data.GrossProfit:N2} ₺");
        AddSummaryRow("Kâr Marjı:", $"%{data.GrossProfitMargin:N2}");

        // Kasiyer kırılımı
        if (data.CashierBreakdown.Count > 0)
        {
            row += 2;
            ws.Cell(row, 1).Value = "KASİYER KIRILIMI";
            ws.Cell(row, 1).Style.Font.SetBold(true).Font.SetFontSize(12);
            row++;
            var cashierHeaders = new[] { "Kasiyer", "Satış", "Toplam", "Nakit", "Kart", "Veresiye" };
            for (int i = 0; i < cashierHeaders.Length; i++)
            {
                ws.Cell(row, i + 1).Value = cashierHeaders[i];
                ws.Cell(row, i + 1).Style.Font.SetBold(true).Fill.SetBackgroundColor(XLColor.LightGray);
            }
            row++;
            foreach (var c in data.CashierBreakdown)
            {
                ws.Cell(row, 1).Value = c.FullName;
                ws.Cell(row, 2).Value = c.SaleCount;
                ws.Cell(row, 3).Value = c.Total;
                ws.Cell(row, 3).Style.NumberFormat.Format = "#,##0.00";
                ws.Cell(row, 4).Value = c.CashTotal;
                ws.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
                ws.Cell(row, 5).Value = c.CardTotal;
                ws.Cell(row, 5).Style.NumberFormat.Format = "#,##0.00";
                ws.Cell(row, 6).Value = c.CreditTotal;
                ws.Cell(row, 6).Style.NumberFormat.Format = "#,##0.00";
                row++;
            }
        }

        ws.Columns().AdjustToContents();
        return WorkbookToBytes(workbook);
    }

    private static byte[] WorkbookToBytes(XLWorkbook workbook)
    {
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
