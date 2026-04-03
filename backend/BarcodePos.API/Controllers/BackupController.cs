using BarcodePos.API.Extensions;
using BarcodePos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class BackupController : ControllerBase
{
    private readonly IBackupService _backupService;

    public BackupController(IBackupService backupService)
    {
        _backupService = backupService;
    }

    private IActionResult? CheckBackupAccess()
    {
        var plan = HttpContext.GetSubscriptionPlan();
        if (plan is not null && !plan.HasBackup)
            return StatusCode(403, new { success = false, message = "Yedekleme mevcut planınızda kullanılamaz. Lütfen paketinizi yükseltin.", featureRestricted = true });
        return null;
    }

    /// <summary>
    /// Yeni yedek oluşturur.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateBackup()
    {
        var check = CheckBackupAccess(); if (check is not null) return check;
        var result = await _backupService.CreateBackupAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Mevcut yedeklerin listesini döndürür.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetBackupList()
    {
        var result = await _backupService.GetBackupListAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Yedek dosyasını indirir.
    /// </summary>
    [HttpGet("{fileName}/download")]
    public async Task<IActionResult> DownloadBackup(string fileName)
    {
        var result = await _backupService.GetBackupFileAsync(fileName);
        if (!result.Success)
            return NotFound(result);

        var (fileStream, name) = result.Data;
        return File(fileStream, "application/octet-stream", name);
    }

    /// <summary>
    /// Yüklenen dosyadan geri yükler.
    /// </summary>
    [HttpPost("restore")]
    [RequestSizeLimit(500 * 1024 * 1024)] // 500 MB
    [EnableRateLimiting("upload")]
    public async Task<IActionResult> RestoreFromUpload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "Dosya yüklenmedi." });

        if (!file.FileName.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { success = false, message = "Sadece .db uzantılı dosyalar kabul edilir." });

        await using var stream = file.OpenReadStream();
        var result = await _backupService.RestoreFromFileAsync(stream);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Mevcut bir yedekten geri yükler.
    /// </summary>
    [HttpPost("restore/{fileName}")]
    public async Task<IActionResult> RestoreFromExisting(string fileName)
    {
        var result = await _backupService.RestoreFromExistingAsync(fileName);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Yedek dosyasını siler.
    /// </summary>
    [HttpDelete("{fileName}")]
    public async Task<IActionResult> DeleteBackup(string fileName)
    {
        var result = await _backupService.DeleteBackupAsync(fileName);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
