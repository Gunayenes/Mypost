using BarcodePos.Infrastructure.Persistence;
using BarcodePos.Infrastructure.Services;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LicenseController : ControllerBase
{
    private readonly AppDbContext _db;

    public LicenseController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Lisans durumunu kontrol eder. Login sayfasından önce çağrılır.
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous]
    public IActionResult GetStatus()
    {
        var machineId = LicenseService.GetMachineId();
        var baseDir = AppContext.BaseDirectory;
        var licenseKey = LicenseService.ReadLicenseFile(baseDir);
        var result = LicenseService.ValidateLicense(licenseKey, machineId);

        return Ok(new
        {
            machineId,
            isLicensed = result.IsValid,
            customerName = result.CustomerName,
            expiresAt = result.ExpiresAt,
            error = result.ErrorMessage,
        });
    }

    /// <summary>
    /// Lisans anahtarını aktive eder ve müşteriye özel kullanıcı oluşturur.
    /// </summary>
    [HttpPost("activate")]
    [AllowAnonymous]
    public async Task<IActionResult> Activate([FromBody] ActivateLicenseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LicenseKey))
            return BadRequest(new { success = false, message = "Lisans anahtarı boş olamaz." });

        var machineId = LicenseService.GetMachineId();
        var result = LicenseService.ValidateLicense(request.LicenseKey.Trim(), machineId);

        if (!result.IsValid)
            return BadRequest(new { success = false, message = result.ErrorMessage });

        // Lisansı kaydet
        LicenseService.SaveLicenseFile(AppContext.BaseDirectory, request.LicenseKey.Trim());

        // Lisans cache'ini temizle — yeni lisans anında geçerli olsun
        Middleware.LicenseCheckMiddleware.InvalidateCache();

        // Müşteriye özel kullanıcı oluştur/güncelle
        if (!string.IsNullOrEmpty(result.Username) && !string.IsNullOrEmpty(result.Password))
        {
            var store = await _db.Stores.FirstOrDefaultAsync();
            var storeId = store?.Id ?? 1;

            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Username == result.Username);

            if (existingUser != null)
            {
                // Kullanıcı varsa şifreyi güncelle
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(result.Password);
                existingUser.IsActive = true;
            }
            else
            {
                // Yeni kullanıcı oluştur
                var user = new User
                {
                    Username = result.Username,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(result.Password),
                    FullName = result.CustomerName ?? result.Username,
                    Role = UserRole.Admin,
                    StoreId = storeId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.Users.Add(user);
            }

            // Varsayılan admin kullanıcısını pasife al (artık müşterinin kendi kullanıcısı var)
            var defaultAdmin = await _db.Users.FirstOrDefaultAsync(u => u.Username == "admin" && u.Username != result.Username);
            if (defaultAdmin != null)
            {
                defaultAdmin.IsActive = false;
            }

            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            success = true,
            message = "Lisans başarıyla aktive edildi!",
            customerName = result.CustomerName,
            expiresAt = result.ExpiresAt,
            username = result.Username,
        });
    }

    /// <summary>
    /// Lisans dosyasını siler — uygulama anında kullanılamaz hale gelir.
    /// Sadece lokal erişimle veya yönetici tarafından çağrılabilir.
    /// </summary>
    [HttpDelete("revoke")]
    [Authorize(Roles = "Admin,SiteAdmin")]
    public IActionResult Revoke()
    {
        var baseDir = AppContext.BaseDirectory;
        var path = Path.Combine(baseDir, "license.key");

        if (System.IO.File.Exists(path))
        {
            System.IO.File.Delete(path);
        }

        // Cache'i temizle — anında etkili olsun
        Middleware.LicenseCheckMiddleware.InvalidateCache();

        return Ok(new { success = true, message = "Lisans iptal edildi." });
    }
}

public class ActivateLicenseRequest
{
    public string LicenseKey { get; set; } = string.Empty;
}
