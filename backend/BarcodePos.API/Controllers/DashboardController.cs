using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Yonetici")]
public class DashboardController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ICurrentUser _currentUser;

    public DashboardController(IReportService reportService, ICurrentUser currentUser)
    {
        _reportService = reportService;
        _currentUser = currentUser;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _reportService.GetDashboardSummaryAsync(_currentUser.StoreId);
        return Ok(result);
    }
}
