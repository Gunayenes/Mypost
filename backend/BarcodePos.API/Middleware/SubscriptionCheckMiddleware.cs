using System.Security.Claims;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.API.Middleware;

/// <summary>
/// Abonelik kontrolü — POS API isteklerinde aktif abonelik olup olmadığını kontrol eder.
/// Abonelik yoksa veya süresi dolmuşsa 403 döner.
/// </summary>
public class SubscriptionCheckMiddleware
{
    private readonly RequestDelegate _next;

    public SubscriptionCheckMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";

        // Muaf endpoint'ler — auth, web, site-admin, lisans, health, statik dosyalar
        if (path.StartsWith("/api/auth")
            || path.StartsWith("/api/web")
            || path.StartsWith("/api/site-admin")
            || path.StartsWith("/api/license")
            || path.StartsWith("/health")
            || path == "/"
            || !path.StartsWith("/api/"))
        {
            await _next(context);
            return;
        }

        // Kullanıcı authenticate olmamışsa middleware devreye girmesin (auth middleware halleder)
        var user = context.User;
        if (user.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        // SiteAdmin rolü muaf
        if (user.IsInRole("SiteAdmin"))
        {
            await _next(context);
            return;
        }

        // StoreId claim'ini al
        var storeIdClaim = user.FindFirstValue("StoreId");
        if (string.IsNullOrEmpty(storeIdClaim) || !int.TryParse(storeIdClaim, out var storeId))
        {
            await _next(context);
            return;
        }

        // Veritabanından abonelik kontrolü
        var db = context.RequestServices.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;

        var subscription = await db.Subscriptions
            .AsNoTracking()
            .Include(s => s.Plan)
            .Include(s => s.WebCustomer)
            .Where(s => s.WebCustomer.StoreId == storeId && s.IsActive && s.ExpiresAt > now)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        if (subscription is null)
        {
            context.Response.StatusCode = 403;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Aboneliğiniz sona erdi. Lütfen aboneliğinizi yenileyiniz.",
                subscriptionExpired = true
            });
            return;
        }

        // Plan limitlerini header'a ekle — frontend'in kullanması için
        context.Items["SubscriptionPlan"] = subscription.Plan;
        context.Items["Subscription"] = subscription;

        await _next(context);
    }
}
