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
    private readonly IEmailService _emailService;

    public WebAuthService(AppDbContext db, IConfiguration config, ILogger<WebAuthService> logger, IEmailService emailService)
    {
        _db = db;
        _config = config;
        _logger = logger;
        _emailService = emailService;
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

        // 5. Demo kategoriler ve ürünler oluştur
        SeedDemoData(store.Id);

        await _db.SaveChangesAsync();

        _logger.LogInformation("Yeni web müşteri kaydı: {Email}, Mağaza: {Store}", emailLower, store.Name);

        // E-posta doğrulama maili gönder
        _ = _emailService.SendEmailConfirmationAsync(customer.Email, $"{customer.FirstName} {customer.LastName}", confirmToken);

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

        // E-posta ile sıfırlama linki gönder
        _ = _emailService.SendPasswordResetAsync(customer.Email, $"{customer.FirstName} {customer.LastName}", customer.PasswordResetToken!);

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

    public async Task<Result> ConfirmEmailAsync(string token)
    {
        var customer = await _db.WebCustomers
            .FirstOrDefaultAsync(c => c.EmailConfirmToken == token && c.EmailConfirmExpiry > DateTime.UtcNow);

        if (customer is null)
            return Result.Fail("Geçersiz veya süresi dolmuş doğrulama bağlantısı.");

        customer.EmailConfirmed = true;
        customer.EmailConfirmToken = null;
        customer.EmailConfirmExpiry = null;
        await _db.SaveChangesAsync();

        _logger.LogInformation("E-posta doğrulandı: {Email}", customer.Email);
        return Result.Ok("E-posta adresiniz başarıyla doğrulandı.");
    }

    public async Task<Result> ResendConfirmationAsync(string email)
    {
        var emailLower = email.Trim().ToLowerInvariant();
        var customer = await _db.WebCustomers.FirstOrDefaultAsync(c => c.Email == emailLower);

        if (customer is null || customer.EmailConfirmed)
            return Result.Ok("İşlem tamamlandı."); // Güvenlik: bilgi sızdırma

        customer.EmailConfirmToken = GenerateToken();
        customer.EmailConfirmExpiry = DateTime.UtcNow.AddHours(48);
        await _db.SaveChangesAsync();

        _ = _emailService.SendEmailConfirmationAsync(customer.Email, $"{customer.FirstName} {customer.LastName}", customer.EmailConfirmToken);

        return Result.Ok("Doğrulama e-postası tekrar gönderildi.");
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

    /// <summary>
    /// Yeni kayıt olan mağazaya demo kategoriler ve örnek ürünler ekler.
    /// </summary>
    private void SeedDemoData(int storeId)
    {
        // Kategoriler
        var gida = new Category { StoreId = storeId, Name = "Gıda", Description = "Yiyecek ve içecek ürünleri" };
        var icecek = new Category { StoreId = storeId, Name = "İçecek", Description = "Sıcak ve soğuk içecekler" };
        var temizlik = new Category { StoreId = storeId, Name = "Temizlik", Description = "Temizlik malzemeleri" };
        var kirtasiye = new Category { StoreId = storeId, Name = "Kırtasiye", Description = "Kırtasiye ürünleri" };

        _db.Categories.AddRange(gida, icecek, temizlik, kirtasiye);
        _db.SaveChanges(); // CategoryId'lerin oluşması için

        // Örnek ürünler
        var prefix = $"20{storeId % 100:D2}";
        var products = new List<Product>
        {
            new() { StoreId = storeId, CategoryId = gida.Id, Barcode = $"{prefix}00000011", Name = "Ekmek", CostPrice = 5, SalePrice = 8, TaxRate = 1, StockQuantity = 50, MinStockLevel = 10 },
            new() { StoreId = storeId, CategoryId = gida.Id, Barcode = $"{prefix}00000028", Name = "Süt 1L", CostPrice = 15, SalePrice = 22, TaxRate = 8, StockQuantity = 30, MinStockLevel = 5 },
            new() { StoreId = storeId, CategoryId = gida.Id, Barcode = $"{prefix}00000035", Name = "Peynir 500g", CostPrice = 40, SalePrice = 60, TaxRate = 8, StockQuantity = 20, MinStockLevel = 3 },
            new() { StoreId = storeId, CategoryId = icecek.Id, Barcode = $"{prefix}00000042", Name = "Su 500ml", CostPrice = 2, SalePrice = 5, TaxRate = 8, StockQuantity = 100, MinStockLevel = 20 },
            new() { StoreId = storeId, CategoryId = icecek.Id, Barcode = $"{prefix}00000059", Name = "Çay 1kg", CostPrice = 50, SalePrice = 75, TaxRate = 8, StockQuantity = 15, MinStockLevel = 3 },
            new() { StoreId = storeId, CategoryId = temizlik.Id, Barcode = $"{prefix}00000066", Name = "Bulaşık Deterjanı", CostPrice = 25, SalePrice = 40, TaxRate = 18, StockQuantity = 25, MinStockLevel = 5 },
            new() { StoreId = storeId, CategoryId = kirtasiye.Id, Barcode = $"{prefix}00000073", Name = "Kalem (Tükenmez)", CostPrice = 3, SalePrice = 7, TaxRate = 18, StockQuantity = 60, MinStockLevel = 10 },
        };

        _db.Products.AddRange(products);
    }
}
