using System.Net;
using System.Security.Claims;
using System.Text.Json;

namespace BarcodePos.API.Middleware;

/// <summary>
/// Tüm yakalanmamış exception'ları yakalar, detaylı loglar ve standart JSON formatında döndürür.
/// Logda: kullanıcı, endpoint, method, hata sebebi, stack trace
/// Response'ta: kullanıcı dostu mesaj + hata kodu (detay sızdırmadan)
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var errorId = Guid.NewGuid().ToString("N")[..8]; // Kısa hata referans kodu
            var userId = context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
            var userName = context.User?.FindFirstValue(ClaimTypes.Name) ?? "-";
            var role = context.User?.FindFirstValue(ClaimTypes.Role) ?? "-";
            var method = context.Request.Method;
            var path = context.Request.Path.Value;
            var query = context.Request.QueryString.Value;
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            _logger.LogError(ex,
                "[{ErrorId}] Hata: {Method} {Path}{Query} | Kullanıcı: {UserId} ({UserName}, {Role}) | IP: {IP} | Sebep: {ExType}: {ExMessage}",
                errorId, method, path, query, userId, userName, role, ip,
                ex.GetType().Name, ex.Message);

            // Inner exception varsa ayrıca logla
            if (ex.InnerException is not null)
            {
                _logger.LogError("[{ErrorId}] Inner Exception: {InnerType}: {InnerMessage}",
                    errorId, ex.InnerException.GetType().Name, ex.InnerException.Message);
            }

            await HandleExceptionAsync(context, ex, errorId);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, string errorId)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Yetkisiz erişim."),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Kayıt bulunamadı."),
            ArgumentException e => (HttpStatusCode.BadRequest, $"Geçersiz istek: {e.Message}"),
            InvalidOperationException => (HttpStatusCode.Conflict, "İşlem tamamlanamadı."),
            Microsoft.EntityFrameworkCore.DbUpdateException e =>
                (HttpStatusCode.InternalServerError, GetDbErrorMessage(e)),
            TaskCanceledException => (HttpStatusCode.RequestTimeout, "İstek zaman aşımına uğradı."),
            _ => (HttpStatusCode.InternalServerError, "Sunucu hatası oluştu.")
        };

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            success = false,
            message,
            errorId, // Frontend bu kodu göstersin, log'da aranabilir
            errors = new List<string>()
        };

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }

    /// <summary>
    /// Veritabanı hatalarını kullanıcı dostu mesaja çevirir.
    /// </summary>
    private static string GetDbErrorMessage(Microsoft.EntityFrameworkCore.DbUpdateException ex)
    {
        var inner = ex.InnerException?.Message ?? ex.Message;

        if (inner.Contains("UNIQUE constraint failed"))
            return "Bu kayıt zaten mevcut (benzersizlik hatası).";
        if (inner.Contains("FOREIGN KEY constraint failed"))
            return "İlişkili kayıt bulunamadı.";
        if (inner.Contains("NOT NULL constraint failed"))
            return "Zorunlu bir alan boş bırakılamaz.";
        if (inner.Contains("no column named"))
            return "Veritabanı güncellenmesi gerekiyor. Lütfen yöneticinize başvurun.";

        return "Veritabanı hatası oluştu.";
    }
}
