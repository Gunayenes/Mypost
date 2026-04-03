using BarcodePos.Application.DTOs.Web;
using BarcodePos.Application.Interfaces;
using BarcodePos.Infrastructure.Persistence;
using BarcodePos.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
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
    [EnableRateLimiting("login")]
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
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _siteAdminService.GetCustomersAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpPost("customers")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateSiteAdminCustomerRequest request)
    {
        var result = await _siteAdminService.CreateCustomerAsync(request);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
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

    [HttpPut("customers/{id}")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] UpdateSiteAdminCustomerRequest request)
    {
        var result = await _siteAdminService.UpdateCustomerAsync(id, request);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }

    [HttpPost("customers/{id}/reset-password")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> ResetCustomerPassword(int id, [FromBody] ResetCustomerPasswordRequest request)
    {
        var result = await _siteAdminService.ResetCustomerPasswordAsync(id, request.NewPassword);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }

    [HttpGet("password-reset-requests")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetPasswordResetRequests()
    {
        var result = await _siteAdminService.GetPasswordResetRequestsAsync();
        return Ok(result);
    }

    [HttpDelete("password-reset-requests/{customerId}")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> DismissPasswordResetRequest(int customerId)
    {
        var result = await _siteAdminService.DismissPasswordResetRequestAsync(customerId);
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
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
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
        return Ok(new
        {
            success = true,
            data = new LicenseStatsResponse
            {
                Total = all.Count,
                Active = all.Count(l => l.IsActive && l.ExpiresAt >= now),
                ExpiringSoon = all.Count(l => l.IsActive && l.ExpiresAt >= now && l.ExpiresAt < now.AddDays(30)),
                Expired = all.Count(l => l.IsActive && l.ExpiresAt < now),
                Inactive = all.Count(l => !l.IsActive),
            }
        });
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
        var password = req.Password ?? license.Password;
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

    // ═══════════════════════════════════════
    // SİSTEM AYARLARI
    // ═══════════════════════════════════════

    [HttpGet("system-info")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetSystemInfo()
    {
        var mainDbPath = Path.Combine(Directory.GetCurrentDirectory(), "BarcodePos.db");
        var licenseDbPath = Path.Combine(Directory.GetCurrentDirectory(), "licenses.db");

        return Ok(new
        {
            success = true,
            data = new
            {
                ApiVersion = typeof(SiteAdminController).Assembly.GetName().Version?.ToString() ?? "1.0.0",
                Environment = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                ServerTime = DateTime.UtcNow,
                MainDbSize = System.IO.File.Exists(mainDbPath) ? new FileInfo(mainDbPath).Length : 0,
                LicenseDbSize = System.IO.File.Exists(licenseDbPath) ? new FileInfo(licenseDbPath).Length : 0,
                JwtSecretConfigured = !string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("JWT_SECRET")),
                AdminEmailConfigured = !string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("SITE_ADMIN_EMAIL")),
                AdminPasswordConfigured = !string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("SITE_ADMIN_PASSWORD")),
                AllowedOriginsConfigured = !string.IsNullOrEmpty(System.Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")),
                TotalLicenses = await _licenseDb.Licenses.CountAsync(),
                ActiveLicenses = await _licenseDb.Licenses.CountAsync(l => l.IsActive && l.ExpiresAt >= DateTime.UtcNow),
            }
        });
    }

    [HttpPost("change-password")]
    [Authorize(Roles = "SiteAdmin")]
    public IActionResult ChangePassword([FromBody] ChangeAdminPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest(new { success = false, message = "Mevcut ve yeni şifre zorunlu." });

        if (req.NewPassword.Length < 8)
            return BadRequest(new { success = false, message = "Yeni şifre en az 8 karakter olmalı." });

        var result = _siteAdminService.ChangeAdminPassword(req.CurrentPassword, req.NewPassword);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });

        return Ok(new { success = true, message = "Şifre başarıyla değiştirildi." });
    }
}
