using BarcodePos.Domain.Interfaces;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/store-settings")]
[Authorize(Roles = "Admin")]
public class StoreSettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ICurrentUser _currentUser;
    private readonly IWebHostEnvironment _env;

    public StoreSettingsController(AppDbContext db, ICurrentUser currentUser, IWebHostEnvironment env)
    {
        _db = db;
        _currentUser = currentUser;
        _env = env;
    }

    /// <summary>
    /// Mağaza bilgilerini getirir.
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetSettings()
    {
        var store = await _db.Stores
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == _currentUser.StoreId);

        if (store is null)
            return NotFound(new { success = false, message = "Mağaza bulunamadı." });

        return Ok(new
        {
            success = true,
            data = new
            {
                store.Id,
                store.Name,
                store.Address,
                store.Phone,
                store.LogoPath,
                store.ThemeColor
            }
        });
    }

    /// <summary>
    /// Mağaza bilgilerini günceller.
    /// </summary>
    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateStoreRequest request)
    {
        var store = await _db.Stores.FindAsync(_currentUser.StoreId);
        if (store is null)
            return NotFound(new { success = false, message = "Mağaza bulunamadı." });

        if (!string.IsNullOrWhiteSpace(request.Name))
            store.Name = request.Name.Trim();
        if (request.Address is not null)
            store.Address = request.Address.Trim();
        if (request.Phone is not null)
            store.Phone = request.Phone.Trim();
        if (request.ThemeColor is not null)
            store.ThemeColor = request.ThemeColor.Trim();

        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Mağaza bilgileri güncellendi." });
    }

    /// <summary>
    /// Mağaza logosu yükler.
    /// </summary>
    [HttpPost("logo")]
    [RequestSizeLimit(5 * 1024 * 1024)] // 5 MB
    [EnableRateLimiting("upload")]
    public async Task<IActionResult> UploadLogo(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { success = false, message = "Dosya yüklenmedi." });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not ".jpg" and not ".jpeg" and not ".png" and not ".webp" and not ".gif" and not ".bmp" and not ".svg")
            return BadRequest(new { success = false, message = "Desteklenen formatlar: JPG, PNG, WebP, GIF, BMP, SVG" });

        // MIME type kontrolü
        if (!file.ContentType.StartsWith("image/"))
            return BadRequest(new { success = false, message = "Sadece resim dosyaları kabul edilir." });

        var store = await _db.Stores.FindAsync(_currentUser.StoreId);
        if (store is null)
            return NotFound(new { success = false, message = "Mağaza bulunamadı." });

        // Uploads klasörünü oluştur
        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads", "logos");
        Directory.CreateDirectory(uploadsDir);

        // Eski logoyu sil
        if (!string.IsNullOrEmpty(store.LogoPath))
        {
            var oldPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), store.LogoPath.TrimStart('/'));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        // Yeni dosyayı kaydet
        var fileName = $"store-{store.Id}-{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        store.LogoPath = $"/uploads/logos/{fileName}";
        await _db.SaveChangesAsync();

        return Ok(new { success = true, data = new { logoPath = store.LogoPath }, message = "Logo başarıyla yüklendi." });
    }

    /// <summary>
    /// Mağaza logosunu siler (varsayılana döner).
    /// </summary>
    [HttpDelete("logo")]
    public async Task<IActionResult> DeleteLogo()
    {
        var store = await _db.Stores.FindAsync(_currentUser.StoreId);
        if (store is null)
            return NotFound(new { success = false, message = "Mağaza bulunamadı." });

        if (!string.IsNullOrEmpty(store.LogoPath))
        {
            var oldPath = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), store.LogoPath.TrimStart('/'));
            if (System.IO.File.Exists(oldPath))
                System.IO.File.Delete(oldPath);
        }

        store.LogoPath = null;
        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Logo silindi." });
    }
}

public class UpdateStoreRequest
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? ThemeColor { get; set; }
}
