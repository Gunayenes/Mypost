using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Web;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Domain.Enums;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace BarcodePos.Infrastructure.Services;

public class WebAuthService : IWebAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<WebAuthService> _logger;

    public WebAuthService(AppDbContext db, IConfiguration config, ILogger<WebAuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<Result<WebLoginResponse>> RegisterAsync(WebRegisterRequest request)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        if (await _db.WebCustomers.AnyAsync(c => c.Email == emailLower))
            return Result<WebLoginResponse>.Fail("Bu e-posta adresi zaten kayıtlı.");

        // 1. Mağaza oluştur
        var store = new Store
        {
            Name = request.BusinessName.Trim(),
            Phone = request.Phone.Trim(),
            IsActive = true
        };
        _db.Stores.Add(store);
        await _db.SaveChangesAsync();

        // 2. Web müşteri oluştur
        var confirmToken = GenerateToken();
        var customer = new WebCustomer
        {
            Email = emailLower,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            BusinessName = request.BusinessName.Trim(),
            Phone = request.Phone.Trim(),
            EmailConfirmToken = confirmToken,
            EmailConfirmExpiry = DateTime.UtcNow.AddHours(48),
            StoreId = store.Id
        };
        _db.WebCustomers.Add(customer);
        await _db.SaveChangesAsync();

        // 3. Mağazaya admin kullanıcı oluştur (POS girişi için)
        var posUser = new User
        {
            StoreId = store.Id,
            Username = emailLower,
            PasswordHash = customer.PasswordHash,
            FullName = $"{request.FirstName.Trim()} {request.LastName.Trim()}",
            Role = UserRole.Admin,
            IsActive = true
        };
        _db.Users.Add(posUser);

        // 4. Demo abonelik oluştur (14 gün ücretsiz)
        var demoPlan = await _db.SubscriptionPlans.FirstAsync(p => p.Slug == "demo");
        var subscription = new Subscription
        {
            WebCustomerId = customer.Id,
            PlanId = demoPlan.Id,
            StartsAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(demoPlan.DurationDays),
            IsActive = true
        };
        _db.Subscriptions.Add(subscription);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Yeni web müşteri kaydı: {Email}, Mağaza: {Store}", emailLower, store.Name);

        // TODO: E-posta doğrulama maili gönder (confirmToken ile)

        var token = GenerateJwt(customer);
        return Result<WebLoginResponse>.Ok(new WebLoginResponse
        {
            Token = token,
            CustomerId = customer.Id,
            Email = customer.Email,
            FullName = $"{customer.FirstName} {customer.LastName}",
            BusinessName = customer.BusinessName,
            ExpiresAt = DateTime.UtcNow.AddMinutes(GetJwtExpiration())
        });
    }

    public async Task<Result<WebLoginResponse>> LoginAsync(WebLoginRequest request)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();
        var customer = await _db.WebCustomers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Email == emailLower);

        if (customer is null)
            return Result<WebLoginResponse>.Fail("E-posta veya şifre hatalı.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, customer.PasswordHash))
            return Result<WebLoginResponse>.Fail("E-posta veya şifre hatalı.");

        if (!customer.IsActive)
            return Result<WebLoginResponse>.Fail("Hesabınız devre dışı bırakılmıştır. Lütfen yöneticinize başvurun.");

        var token = GenerateJwt(customer);
        return Result<WebLoginResponse>.Ok(new WebLoginResponse
        {
            Token = token,
            CustomerId = customer.Id,
            Email = customer.Email,
            FullName = $"{customer.FirstName} {customer.LastName}",
            BusinessName = customer.BusinessName,
            ExpiresAt = DateTime.UtcNow.AddMinutes(GetJwtExpiration())
        });
    }

    public async Task<Result> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();
        var customer = await _db.WebCustomers.FirstOrDefaultAsync(c => c.Email == emailLower);

        // Güvenlik: Kullanıcı bulunamasa bile başarılı yanıt dön
        if (customer is null)
            return Result.Ok("Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.");

        customer.PasswordResetToken = GenerateToken();
        customer.PasswordResetExpiry = DateTime.UtcNow.AddHours(1);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Şifre sıfırlama talebi: {Email}", emailLower);

        // TODO: E-posta ile sıfırlama linki gönder

        return Result.Ok("Eğer bu e-posta kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.");
    }

    public async Task<Result> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var customer = await _db.WebCustomers
            .FirstOrDefaultAsync(c => c.PasswordResetToken == request.Token
                                     && c.PasswordResetExpiry > DateTime.UtcNow);

        if (customer is null)
            return Result.Fail("Geçersiz veya süresi dolmuş token.");

        customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        customer.PasswordResetToken = null;
        customer.PasswordResetExpiry = null;
        await _db.SaveChangesAsync();

        // POS kullanıcısının şifresini de güncelle
        var posUser = await _db.Users.FirstOrDefaultAsync(u => u.Username == customer.Email && u.StoreId == customer.StoreId);
        if (posUser is not null)
        {
            posUser.PasswordHash = customer.PasswordHash;
            await _db.SaveChangesAsync();
        }

        _logger.LogInformation("Şifre sıfırlandı: {Email}", customer.Email);
        return Result.Ok("Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.");
    }

    public async Task<Result<WebProfileResponse>> GetProfileAsync(int customerId)
    {
        var customer = await _db.WebCustomers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer is null)
            return Result<WebProfileResponse>.Fail("Müşteri bulunamadı.");

        var activeSub = await _db.Subscriptions
            .AsNoTracking()
            .Include(s => s.Plan)
            .Where(s => s.WebCustomerId == customerId && s.IsActive && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        return Result<WebProfileResponse>.Ok(new WebProfileResponse
        {
            Id = customer.Id,
            Email = customer.Email,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            BusinessName = customer.BusinessName,
            Phone = customer.Phone,
            EmailConfirmed = customer.EmailConfirmed,
            ActiveSubscription = activeSub is null ? null : new SubscriptionInfo
            {
                PlanName = activeSub.Plan.Name,
                PlanSlug = activeSub.Plan.Slug,
                Price = activeSub.Plan.Price,
                StartsAt = activeSub.StartsAt,
                ExpiresAt = activeSub.ExpiresAt,
                DaysRemaining = Math.Max(0, (activeSub.ExpiresAt - DateTime.UtcNow).Days),
                MaxProducts = activeSub.Plan.MaxProducts,
                MaxUsers = activeSub.Plan.MaxUsers,
                HasReports = activeSub.Plan.HasReports,
                HasBackup = activeSub.Plan.HasBackup,
                HasSupport = activeSub.Plan.HasSupport
            }
        });
    }

    // ── Yardımcılar ──
    private string GenerateJwt(WebCustomer customer)
    {
        var jwt = _config.GetSection("JwtSettings");
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwt["Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, customer.Id.ToString()),
            new(ClaimTypes.Email, customer.Email),
            new("FullName", $"{customer.FirstName} {customer.LastName}"),
            new("StoreId", customer.StoreId.ToString()),
            new(ClaimTypes.Role, "WebCustomer")
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(GetJwtExpiration()),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private int GetJwtExpiration() =>
        int.Parse(_config.GetSection("JwtSettings")["ExpirationInMinutes"] ?? "30");

    private static string GenerateToken() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
}
