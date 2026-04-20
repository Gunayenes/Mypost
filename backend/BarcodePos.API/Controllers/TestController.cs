using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

/// <summary>
/// Geliştirme amaçlı test endpoint'leri.
/// JWT ve yetkilendirme mekanizmasını doğrulamak için kullanılır.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    /// <summary>
    /// Herkese açık test endpoint'i — API'nin çalıştığını doğrular.
    /// </summary>
    [HttpGet("public")]
    public IActionResult Public()
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                message = "Cari Soft API çalışıyor.",
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            }
        });
    }

    /// <summary>
    /// Kimlik doğrulaması gerektiren test endpoint'i.
    /// JWT token ile erişim doğrulamasını test eder.
    /// </summary>
    [Authorize]
    [HttpGet("secure")]
    public IActionResult Secure()
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                message = "Yetkili erişim başarılı.",
                user = User.Identity?.Name,
                claims = User.Claims.Select(c => new { c.Type, c.Value })
            }
        });
    }

    /// <summary>
    /// Sadece Admin rolü için test endpoint'i.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpGet("admin-only")]
    public IActionResult AdminOnly()
    {
        return Ok(new
        {
            success = true,
            data = new { message = "Admin erişimi başarılı." }
        });
    }
}
