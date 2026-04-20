using BarcodePos.Infrastructure.Services;

namespace BarcodePos.API.Middleware;

/// <summary>
/// Her API isteğinde lisansı kontrol eder.
/// Lisans geçersiz veya süresi dolmuşsa 403 döner.
/// </summary>
public class LicenseCheckMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _machineId;
    private readonly bool _skipLicenseCheck;

    // Son kontrol zamanı ve sonucu — her istekte dosya okumamak için cache
    private static DateTime _lastCheckTime = DateTime.MinValue;
    private static bool _lastCheckResult = false;
    private static string? _lastError = null;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(5);
    private static readonly object _lock = new();

    public LicenseCheckMiddleware(RequestDelegate next)
    {
        _next = next;
        _machineId = LicenseService.GetMachineId();
        // Cloud/Railway ortamında lisans kontrolü atla
        _skipLicenseCheck = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DISABLE_LICENSE_CHECK"))
                         || !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("RAILWAY_ENVIRONMENT"));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        // Lisans ve health endpoint'leri kontrolden muaf
        if (path.StartsWith("/api/license") || path.StartsWith("/api/web") || path.StartsWith("/api/site-admin") || path.StartsWith("/health") || path == "/")
        {
            await _next(context);
            return;
        }

        // Statik dosyalar muaf
        if (!path.StartsWith("/api/"))
        {
            await _next(context);
            return;
        }

        // Cloud ortamda lisans kontrolü atla
        if (_skipLicenseCheck)
        {
            await _next(context);
            return;
        }

        // Login de muaf — ama lisans geçerli olmalı, sadece auth token yok diye engellemeyelim
        // Login isteği bile lisans kontrolünden geçmeli
        var (isValid, error) = CheckLicense();

        if (!isValid)
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = error ?? "Lisans geçersiz. Lütfen geliştiriciyle iletişime geçin.",
                licenseExpired = true,
            });
            return;
        }

        await _next(context);
    }

    private (bool isValid, string? error) CheckLicense()
    {
        lock (_lock)
        {
            // Cache süresi dolmadıysa önceki sonucu kullan
            if (DateTime.UtcNow - _lastCheckTime < CheckInterval)
            {
                return (_lastCheckResult, _lastError);
            }

            // Lisans dosyasını oku ve doğrula
            var baseDir = AppContext.BaseDirectory;
            var licenseKey = LicenseService.ReadLicenseFile(baseDir);
            var result = LicenseService.ValidateLicense(licenseKey, _machineId);

            _lastCheckTime = DateTime.UtcNow;
            _lastCheckResult = result.IsValid;
            _lastError = result.ErrorMessage;

            return (result.IsValid, result.ErrorMessage);
        }
    }

    /// <summary>
    /// Cache'i temizler — lisans değiştiğinde anında yeniden kontrol edilmesini sağlar.
    /// </summary>
    public static void InvalidateCache()
    {
        lock (_lock)
        {
            _lastCheckTime = DateTime.MinValue;
        }
    }
}
