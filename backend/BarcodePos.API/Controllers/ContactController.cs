using BarcodePos.Domain.Entities;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<ContactController> _logger;

    public ContactController(AppDbContext db, ILogger<ContactController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Ziyaretçiler iletişim formundan mesaj gönderir (auth gerektirmez).
    /// </summary>
    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    public async Task<IActionResult> Send([FromBody] ContactSendRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { success = false, message = "Ad, e-posta ve mesaj zorunludur." });

        if (request.Message.Length > 5000)
            return BadRequest(new { success = false, message = "Mesaj çok uzun (maks 5000 karakter)." });

        var msg = new ContactMessage
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone?.Trim(),
            BusinessName = request.BusinessName?.Trim(),
            Subject = string.IsNullOrWhiteSpace(request.Subject) ? "Genel" : request.Subject.Trim(),
            Message = request.Message.Trim(),
            IsRead = false
        };

        _db.ContactMessages.Add(msg);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Yeni iletişim mesajı: {FullName} ({Email})", msg.FullName, msg.Email);

        return Ok(new { success = true, message = "Mesajınız alındı. En kısa sürede size dönüş yapacağız." });
    }

    /// <summary>
    /// Site admin — tüm mesajları listeler.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> GetAll([FromQuery] bool? unreadOnly, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.ContactMessages.AsNoTracking().AsQueryable();
        if (unreadOnly == true) query = query.Where(m => !m.IsRead);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.FullName,
                m.Email,
                m.Phone,
                m.BusinessName,
                m.Subject,
                m.Message,
                m.IsRead,
                m.ReadAt,
                m.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new
            {
                items,
                totalCount = total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize),
                hasPreviousPage = page > 1,
                hasNextPage = page * pageSize < total
            }
        });
    }

    /// <summary>
    /// Site admin — mesajı okundu olarak işaretler.
    /// </summary>
    [HttpPatch("{id}/mark-read")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var msg = await _db.ContactMessages.FindAsync(id);
        if (msg is null) return NotFound(new { success = false, message = "Mesaj bulunamadı." });

        msg.IsRead = true;
        msg.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { success = true });
    }

    /// <summary>
    /// Site admin — mesajı siler.
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> Delete(int id)
    {
        var msg = await _db.ContactMessages.FindAsync(id);
        if (msg is null) return NotFound(new { success = false, message = "Mesaj bulunamadı." });

        _db.ContactMessages.Remove(msg);
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    /// <summary>
    /// Site admin — okunmamış mesaj sayısı (bildirim için).
    /// </summary>
    [HttpGet("unread-count")]
    [Authorize(Roles = "SiteAdmin")]
    public async Task<IActionResult> UnreadCount()
    {
        var count = await _db.ContactMessages.CountAsync(m => !m.IsRead);
        return Ok(new { success = true, data = count });
    }
}

public class ContactSendRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BusinessName { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
}
