using BarcodePos.API.Extensions;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Yonetici")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly IExcelExportService _excelExportService;
    private readonly ICurrentUser _currentUser;

    public ReportsController(IReportService reportService, IExcelExportService excelExportService, ICurrentUser currentUser)
    {
        _reportService = reportService;
        _excelExportService = excelExportService;
        _currentUser = currentUser;
    }

    private IActionResult? CheckReportAccess()
    {
        var plan = HttpContext.GetSubscriptionPlan();
        if (plan is not null && !plan.HasReports)
            return StatusCode(403, new { success = false, message = "Raporlar mevcut planınızda kullanılamaz. Lütfen paketinizi yükseltin.", featureRestricted = true });
        return null;
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDailyReport([FromQuery] DateTime? date)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var reportDate = date ?? DateTime.UtcNow.Date;
        var result = await _reportService.GetDailyReportAsync(reportDate, _currentUser.StoreId);
        return Ok(result);
    }

    [HttpGet("daily-closing")]
    public async Task<IActionResult> GetDailyClosingReport([FromQuery] DateTime? date)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var reportDate = date ?? DateTime.UtcNow.Date;
        var result = await _reportService.GetDailyClosingReportAsync(reportDate, _currentUser.StoreId);
        return Ok(result);
    }

    [HttpGet("period")]
    public async Task<IActionResult> GetPeriodReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var result = await _reportService.GetPeriodReportAsync(from, to, _currentUser.StoreId);
        return Ok(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] int limit = 10)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var result = await _reportService.GetTopProductsAsync(from, to, limit, _currentUser.StoreId);
        return Ok(result);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var result = await _reportService.GetLowStockReportAsync(_currentUser.StoreId);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("profit")]
    public async Task<IActionResult> GetProfitReport([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var result = await _reportService.GetProfitReportAsync(from, to, _currentUser.StoreId);
        return Ok(result);
    }

    [HttpGet("payment-summary")]
    public async Task<IActionResult> GetPaymentSummary([FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var result = await _reportService.GetPaymentSummaryAsync(from, to, _currentUser.StoreId);
        return Ok(result);
    }

    [HttpGet("export/excel")]
    public async Task<IActionResult> ExportExcel([FromQuery] string type, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int limit = 10)
    {
        var check = CheckReportAccess(); if (check is not null) return check;
        var dateFrom = from ?? DateTime.UtcNow.Date.AddDays(-30);
        var dateTo = to ?? DateTime.UtcNow.Date;

        byte[] fileBytes;
        string fileName;

        switch (type?.ToLower())
        {
            case "sales":
                fileBytes = await _excelExportService.ExportSalesAsync(dateFrom, dateTo, _currentUser.StoreId);
                fileName = $"satis-raporu-{dateFrom:yyyyMMdd}-{dateTo:yyyyMMdd}.xlsx";
                break;
            case "daily-closing":
                fileBytes = await _excelExportService.ExportDailyClosingAsync(dateFrom, _currentUser.StoreId);
                fileName = $"gun-sonu-raporu-{dateFrom:yyyyMMdd}.xlsx";
                break;
            case "low-stock":
                fileBytes = await _excelExportService.ExportLowStockAsync(_currentUser.StoreId);
                fileName = $"dusuk-stok-{DateTime.UtcNow:yyyyMMdd}.xlsx";
                break;
            case "top-products":
                fileBytes = await _excelExportService.ExportTopProductsAsync(dateFrom, dateTo, limit, _currentUser.StoreId);
                fileName = $"en-cok-satan-{dateFrom:yyyyMMdd}-{dateTo:yyyyMMdd}.xlsx";
                break;
            case "profit":
                if (!_currentUser.IsAdmin)
                    return Forbid();
                fileBytes = await _excelExportService.ExportProfitAsync(dateFrom, dateTo, _currentUser.StoreId);
                fileName = $"kar-raporu-{dateFrom:yyyyMMdd}-{dateTo:yyyyMMdd}.xlsx";
                break;
            default:
                return BadRequest(new { success = false, message = "Geçersiz rapor tipi. Geçerli: sales, daily-closing, low-stock, top-products, profit" });
        }

        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
