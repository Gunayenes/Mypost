using BarcodePos.Application.DTOs.Web;
using BarcodePos.Application.Interfaces;
using BarcodePos.Infrastructure.Persistence;
using BarcodePos.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/site-admin")]
public class SiteAdminController : ControllerBase
{
    private readonly ISiteAdminService _siteAdminService;
    private readonly LicenseDbContext _licenseDb;

    public SiteAdminController(ISiteAdminService siteAdminService, LicenseDbContext licenseDb)
    {
        _siteAdminService = siteAdminService;
        _licenseDb = licenseDb;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] SiteAdminLoginRequest request)
    {
        var result = await _siteAdminService.LoginAsync(request);
        if (!result.Success)
            return Unauthorized(new { success = false, message = result.Message });
        return Ok(result);
    }

    [HttpGet("dashboard")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _siteAdminService.GetDashboardAsync();
        return Ok(result);
    }

    [HttpGet("customers")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _siteAdminService.GetCustomersAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("customers/{id}")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetCustomerDetail(int id)
    {
        var result = await _siteAdminService.GetCustomerDetailAsync(id);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    [HttpPatch("customers/{id}/toggle-active")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> ToggleCustomerActive(int id)
    {
        var result = await _siteAdminService.ToggleCustomerActiveAsync(id);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    [HttpGet("subscriptions")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetSubscriptions(
        [FromQuery] string? filter,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _siteAdminService.GetSubscriptionsAsync(filter, page, pageSize);
        return Ok(result);
    }

    [HttpPatch("subscriptions/{id}/extend")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> ExtendSubscription(int id, [FromBody] ExtendSubscriptionRequest request)
    {
        var result = await _siteAdminService.ExtendSubscriptionAsync(id, request.Days);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    [HttpPatch("subscriptions/{id}/cancel")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> CancelSubscription(int id)
    {
        var result = await _siteAdminService.CancelSubscriptionAsync(id);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    // ═══════════════════════════════════════
    // LISANS YÖNETİMİ
    // ═══════════════════════════════════════

    [HttpGet("licenses/stats")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetLicenseStats()
    {
        var now = DateTime.UtcNow;
        var all = await _licenseDb.Licenses.ToListAsync();
        return Ok(new { success = true, data = new LicenseStatsResponse
        {
            Total = all.Count,
            Active = all.Count(l => l.IsActive && l.ExpiresAt >= now),
            ExpiringSoon = all.Count(l => l.IsActive && l.ExpiresAt >= now && l.ExpiresAt < now.AddDays(30)),
            Expired = all.Count(l => l.IsActive && l.ExpiresAt < now),
            Inactive = all.Count(l => !l.IsActive),
        }});
    }

    [HttpGet("licenses")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetLicenses()
    {
        var now = DateTime.UtcNow;
        var licenses = await _licenseDb.Licenses.OrderByDescending(l => l.IssuedAt).ToListAsync();
        var items = licenses.Select(l => new LicenseListItem
        {
            Id = l.Id,
            CustomerName = l.CustomerName,
            MachineId = l.MachineId,
            Phone = l.Phone,
            Note = l.Note,
            Username = l.Username,
            Password = l.Password,
            LicenseKey = l.LicenseKey,
            DurationDays = l.DurationDays,
            IssuedAt = l.IssuedAt,
            ExpiresAt = l.ExpiresAt,
            IsActive = l.IsActive,
            Status = !l.IsActive ? "Pasif"
                : l.ExpiresAt < now ? "Süresi Dolmuş"
                : l.ExpiresAt < now.AddDays(30) ? "Yakında Dolacak"
                : "Aktif",
            DaysLeft = l.IsActive ? Math.Max(0, (int)(l.ExpiresAt - now).TotalDays) : 0,
        }).ToList();
        return Ok(new { success = true, data = items });
    }

    [HttpPost("licenses")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> CreateLicense([FromBody] CreateLicenseRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CustomerName) || string.IsNullOrWhiteSpace(req.MachineId))
            return BadRequest(new { success = false, message = "Müşteri adı ve Makine ID zorunlu." });
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { success = false, message = "Kullanıcı adı ve şifre zorunlu." });

        var days = req.DurationDays > 0 ? req.DurationDays : 365;
        var expiresAt = DateTime.UtcNow.AddDays(days);
        var licenseKey = LicenseService.GenerateLicenseKey(
            req.MachineId.Trim(), req.CustomerName.Trim(), expiresAt, req.Username.Trim(), req.Password.Trim());

        var record = new LicenseRecord
        {
            CustomerName = req.CustomerName.Trim(),
            MachineId = req.MachineId.Trim(),
            Phone = req.Phone?.Trim() ?? "",
            Note = req.Note?.Trim() ?? "",
            Username = req.Username.Trim(),
            Password = req.Password.Trim(),
            LicenseKey = licenseKey,
            DurationDays = days,
            IssuedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            IsActive = true,
        };
        _licenseDb.Licenses.Add(record);
        await _licenseDb.SaveChangesAsync();
        return Ok(new { success = true, data = new { licenseKey, record.Id } });
    }

    [HttpPost("licenses/{id}/renew")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> RenewLicense(int id, [FromBody] RenewLicenseRequest req)
    {
        var license = await _licenseDb.Licenses.FindAsync(id);
        if (license == null) return NotFound(new { success = false, message = "Lisans bulunamadı." });

        var days = req.DurationDays > 0 ? req.DurationDays : 365;
        var expiresAt = DateTime.UtcNow.AddDays(days);
        var password = req.Password ?? "Pos123!";
        var newKey = LicenseService.GenerateLicenseKey(
            license.MachineId, license.CustomerName, expiresAt, license.Username, password);

        license.Password = password;
        license.LicenseKey = newKey;
        license.DurationDays = days;
        license.ExpiresAt = expiresAt;
        license.IssuedAt = DateTime.UtcNow;
        license.IsActive = true;
        await _licenseDb.SaveChangesAsync();
        return Ok(new { success = true, data = new { licenseKey = newKey } });
    }

    [HttpPost("licenses/{id}/toggle")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> ToggleLicense(int id)
    {
        var license = await _licenseDb.Licenses.FindAsync(id);
        if (license == null) return NotFound(new { success = false, message = "Lisans bulunamadı." });
        license.IsActive = !license.IsActive;
        await _licenseDb.SaveChangesAsync();
        return Ok(new { success = true, data = new { license.IsActive } });
    }

    [HttpDelete("licenses/{id}")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> DeleteLicense(int id)
    {
        var license = await _licenseDb.Licenses.FindAsync(id);
        if (license == null) return NotFound(new { success = false, message = "Lisans bulunamadı." });
        _licenseDb.Licenses.Remove(license);
        await _licenseDb.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
