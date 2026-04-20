using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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

public class SiteAdminService : ISiteAdminService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<SiteAdminService> _logger;

    public SiteAdminService(AppDbContext db, IConfiguration config, ILogger<SiteAdminService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public Task<Result<SiteAdminLoginResponse>> LoginAsync(SiteAdminLoginRequest request)
    {
        var adminEmail = Environment.GetEnvironmentVariable("SITE_ADMIN_EMAIL")
                         ?? _config["SiteAdmin:Email"];
        var adminPassword = Environment.GetEnvironmentVariable("SITE_ADMIN_PASSWORD")
                            ?? _config["SiteAdmin:Password"];

        if (string.IsNullOrEmpty(adminEmail) || string.IsNullOrEmpty(adminPassword))
        {
            _logger.LogError("Site admin kimlik bilgileri yapılandırılmamış. SITE_ADMIN_EMAIL/PASSWORD env var veya SiteAdmin config ayarlayın.");
            return Task.FromResult(Result<SiteAdminLoginResponse>.Fail("Sistem yapılandırma hatası."));
        }

        if (!string.Equals(request.Email, adminEmail, StringComparison.OrdinalIgnoreCase) ||
            request.Password != adminPassword)
        {
            return Task.FromResult(Result<SiteAdminLoginResponse>.Fail("E-posta veya şifre hatalı."));
        }

        var jwt = _config.GetSection("JwtSettings");
        var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") ?? jwt["Secret"]!;
        var expMinutes = int.Parse(jwt["ExpirationInMinutes"] ?? "30");
        var expiresAt = DateTime.UtcNow.AddMinutes(expMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "0"),
            new(ClaimTypes.Name, adminEmail),
            new(ClaimTypes.Role, "SiteAdmin"),
            new("FullName", "Site Yöneticisi")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        _logger.LogInformation("Site admin girişi: {Email}", adminEmail);

        return Task.FromResult(Result<SiteAdminLoginResponse>.Ok(new SiteAdminLoginResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Email = adminEmail,
            ExpiresAt = expiresAt
        }));
    }

    public async Task<Result<SiteAdminDashboardResponse>> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var in7Days = now.AddDays(7);

        var totalCustomers = await _db.WebCustomers.CountAsync();
        var activeCustomers = await _db.WebCustomers.CountAsync(c => c.IsActive);
        var totalSubs = await _db.Subscriptions.CountAsync();
        var activeSubs = await _db.Subscriptions.CountAsync(s => s.IsActive && s.ExpiresAt > now);
        var expiring = await _db.Subscriptions.CountAsync(s => s.IsActive && s.ExpiresAt > now && s.ExpiresAt <= in7Days);
        var totalStores = await _db.Stores.CountAsync();

        var passwordResetRequests = await _db.WebCustomers
            .CountAsync(c => c.PasswordResetToken != null && c.PasswordResetExpiry > now);

        var recentCustomers = await _db.WebCustomers
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new RecentCustomerItem
            {
                Id = c.Id,
                Email = c.Email,
                FullName = $"{c.FirstName} {c.LastName}",
                BusinessName = c.BusinessName,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Result<SiteAdminDashboardResponse>.Ok(new SiteAdminDashboardResponse
        {
            TotalCustomers = totalCustomers,
            ActiveCustomers = activeCustomers,
            TotalSubscriptions = totalSubs,
            ActiveSubscriptions = activeSubs,
            ExpiringIn7Days = expiring,
            TotalStores = totalStores,
            PasswordResetRequests = passwordResetRequests,
            RecentCustomers = recentCustomers
        });
    }

    public async Task<Result<PagedResult<SiteAdminCustomerListItem>>> GetCustomersAsync(string? search, int page, int pageSize)
    {
        var query = _db.WebCustomers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLowerInvariant();
            query = query.Where(c =>
                c.Email.Contains(s) ||
                c.FirstName.Contains(s) ||
                c.LastName.Contains(s) ||
                c.BusinessName.Contains(s));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new SiteAdminCustomerListItem
            {
                Id = c.Id,
                Email = c.Email,
                FirstName = c.FirstName,
                LastName = c.LastName,
                BusinessName = c.BusinessName,
                Phone = c.Phone,
                IsActive = c.IsActive,
                EmailConfirmed = c.EmailConfirmed,
                CreatedAt = c.CreatedAt,
                ActivePlan = c.Subscriptions
                    .Where(s => s.IsActive && s.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(s => s.ExpiresAt)
                    .Select(s => s.Plan.Name)
                    .FirstOrDefault(),
                SubscriptionExpiry = c.Subscriptions
                    .Where(s => s.IsActive && s.ExpiresAt > DateTime.UtcNow)
                    .OrderByDescending(s => s.ExpiresAt)
                    .Select(s => (DateTime?)s.ExpiresAt)
                    .FirstOrDefault()
            })
            .ToListAsync();

        return Result<PagedResult<SiteAdminCustomerListItem>>.Ok(
            PagedResult<SiteAdminCustomerListItem>.Create(items, totalCount, page, pageSize));
    }

    public async Task<Result<SiteAdminCustomerDetail>> GetCustomerDetailAsync(int customerId)
    {
        var customer = await _db.WebCustomers
            .AsNoTracking()
            .Include(c => c.Subscriptions)
                .ThenInclude(s => s.Plan)
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer is null)
            return Result<SiteAdminCustomerDetail>.Fail("Müşteri bulunamadı.");

        var now = DateTime.UtcNow;

        return Result<SiteAdminCustomerDetail>.Ok(new SiteAdminCustomerDetail
        {
            Id = customer.Id,
            Email = customer.Email,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            BusinessName = customer.BusinessName,
            Phone = customer.Phone,
            IsActive = customer.IsActive,
            EmailConfirmed = customer.EmailConfirmed,
            StoreId = customer.StoreId,
            CreatedAt = customer.CreatedAt,
            Subscriptions = customer.Subscriptions
                .OrderByDescending(s => s.StartsAt)
                .Select(s => new SiteAdminSubscriptionItem
                {
                    Id = s.Id,
                    WebCustomerId = s.WebCustomerId,
                    CustomerEmail = customer.Email,
                    CustomerName = $"{customer.FirstName} {customer.LastName}",
                    BusinessName = customer.BusinessName,
                    PlanName = s.Plan.Name,
                    PlanSlug = s.Plan.Slug,
                    StartsAt = s.StartsAt,
                    ExpiresAt = s.ExpiresAt,
                    IsActive = s.IsActive,
                    DaysRemaining = s.ExpiresAt > now ? (int)(s.ExpiresAt - now).TotalDays : 0
                })
                .ToList()
        });
    }

    public async Task<Result<SiteAdminCustomerDetail>> CreateCustomerAsync(CreateSiteAdminCustomerRequest request)
    {
        var emailLower = request.Email.Trim().ToLowerInvariant();

        if (await _db.WebCustomers.AnyAsync(c => c.Email == emailLower))
            return Result<SiteAdminCustomerDetail>.Fail("Bu e-posta adresi zaten kayıtlı.");

        // 1. Mağaza oluştur
        var store = new Store
        {
            Name = request.BusinessName.Trim(),
            Phone = request.Phone?.Trim(),
            IsActive = true
        };
        _db.Stores.Add(store);
        await _db.SaveChangesAsync();

        // 2. Web müşteri oluştur
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var customer = new WebCustomer
        {
            Email = emailLower,
            PasswordHash = passwordHash,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            BusinessName = request.BusinessName.Trim(),
            Phone = request.Phone?.Trim(),
            EmailConfirmed = true,
            IsActive = true,
            StoreId = store.Id
        };
        _db.WebCustomers.Add(customer);
        await _db.SaveChangesAsync();

        // 3. POS admin kullanıcı oluştur
        var posUser = new User
        {
            StoreId = store.Id,
            Username = emailLower,
            PasswordHash = passwordHash,
            FullName = $"{request.FirstName.Trim()} {request.LastName.Trim()}",
            Role = UserRole.Admin,
            IsActive = true
        };
        _db.Users.Add(posUser);

        // 4. Abonelik oluştur
        var plan = request.PlanId.HasValue
            ? await _db.SubscriptionPlans.FindAsync(request.PlanId.Value)
            : await _db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Slug == "demo");

        if (plan is not null)
        {
            _db.Subscriptions.Add(new Subscription
            {
                WebCustomerId = customer.Id,
                PlanId = plan.Id,
                StartsAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(plan.DurationDays),
                IsActive = true
            });
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Site admin yeni müşteri oluşturdu: {Email}", emailLower);

        return await GetCustomerDetailAsync(customer.Id);
    }

    public async Task<Result> ToggleCustomerActiveAsync(int customerId)
    {
        var customer = await _db.WebCustomers.FindAsync(customerId);
        if (customer is null)
            return Result.Fail("Müşteri bulunamadı.");

        customer.IsActive = !customer.IsActive;

        // Mağazadaki POS kullanıcılarını da aynı duruma getir
        var posUsers = await _db.Users
            .Where(u => u.StoreId == customer.StoreId)
            .ToListAsync();
        foreach (var posUser in posUsers)
            posUser.IsActive = customer.IsActive;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Müşteri {Id} durumu değiştirildi: {IsActive}", customerId, customer.IsActive);
        return Result.Ok(customer.IsActive ? "Müşteri aktifleştirildi." : "Müşteri devre dışı bırakıldı.");
    }

    public async Task<Result> UpdateCustomerAsync(int customerId, UpdateSiteAdminCustomerRequest request)
    {
        var customer = await _db.WebCustomers.FindAsync(customerId);
        if (customer is null)
            return Result.Fail("Müşteri bulunamadı.");

        // E-posta değiştiyse benzersizlik kontrolü
        if (!string.Equals(customer.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var exists = await _db.WebCustomers.AnyAsync(c => c.Email == request.Email && c.Id != customerId);
            if (exists)
                return Result.Fail("Bu e-posta adresi başka bir müşteri tarafından kullanılıyor.");
        }

        customer.FirstName = request.FirstName.Trim();
        customer.LastName = request.LastName.Trim();
        customer.BusinessName = request.BusinessName.Trim();
        customer.Email = request.Email.Trim();
        customer.Phone = request.Phone?.Trim();
        customer.IsActive = request.IsActive;
        customer.EmailConfirmed = request.EmailConfirmed;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Müşteri {Id} güncellendi: {Email}", customerId, customer.Email);
        return Result.Ok("Müşteri bilgileri güncellendi.");
    }

    public async Task<Result> ResetCustomerPasswordAsync(int customerId, string newPassword)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
            return Result.Fail("Şifre en az 6 karakter olmalıdır.");

        var customer = await _db.WebCustomers.FindAsync(customerId);
        if (customer is null)
            return Result.Fail("Müşteri bulunamadı.");

        customer.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        customer.PasswordResetToken = null;
        customer.PasswordResetExpiry = null;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Müşteri {Id} şifresi sıfırlandı", customerId);
        return Result.Ok("Şifre başarıyla sıfırlandı.");
    }

    public async Task<Result<PagedResult<SiteAdminSubscriptionItem>>> GetSubscriptionsAsync(string? filter, int page, int pageSize)
    {
        var now = DateTime.UtcNow;
        var query = _db.Subscriptions
            .AsNoTracking()
            .Include(s => s.WebCustomer)
            .Include(s => s.Plan)
            .AsQueryable();

        if (filter == "active")
            query = query.Where(s => s.IsActive && s.ExpiresAt > now);
        else if (filter == "expired")
            query = query.Where(s => !s.IsActive || s.ExpiresAt <= now);
        else if (filter == "expiring")
            query = query.Where(s => s.IsActive && s.ExpiresAt > now && s.ExpiresAt <= now.AddDays(7));

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.StartsAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SiteAdminSubscriptionItem
            {
                Id = s.Id,
                WebCustomerId = s.WebCustomerId,
                CustomerEmail = s.WebCustomer.Email,
                CustomerName = s.WebCustomer.FirstName + " " + s.WebCustomer.LastName,
                BusinessName = s.WebCustomer.BusinessName,
                PlanName = s.Plan.Name,
                PlanSlug = s.Plan.Slug,
                StartsAt = s.StartsAt,
                ExpiresAt = s.ExpiresAt,
                IsActive = s.IsActive,
                DaysRemaining = s.ExpiresAt > now ? (int)(s.ExpiresAt - now).TotalDays : 0
            })
            .ToListAsync();

        return Result<PagedResult<SiteAdminSubscriptionItem>>.Ok(
            PagedResult<SiteAdminSubscriptionItem>.Create(items, totalCount, page, pageSize));
    }

    public async Task<Result> ExtendSubscriptionAsync(int subscriptionId, int days)
    {
        var sub = await _db.Subscriptions.FindAsync(subscriptionId);
        if (sub is null)
            return Result.Fail("Abonelik bulunamadı.");

        var baseDate = sub.ExpiresAt > DateTime.UtcNow ? sub.ExpiresAt : DateTime.UtcNow;
        sub.ExpiresAt = baseDate.AddDays(days);
        sub.IsActive = true;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Abonelik {Id} uzatıldı: +{Days} gün → {Expiry}", subscriptionId, days, sub.ExpiresAt);
        return Result.Ok($"Abonelik {days} gün uzatıldı. Yeni bitiş: {sub.ExpiresAt:dd.MM.yyyy}");
    }

    public async Task<Result> CancelSubscriptionAsync(int subscriptionId)
    {
        var sub = await _db.Subscriptions.FindAsync(subscriptionId);
        if (sub is null)
            return Result.Fail("Abonelik bulunamadı.");

        sub.IsActive = false;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Abonelik {Id} iptal edildi.", subscriptionId);
        return Result.Ok("Abonelik iptal edildi.");
    }

    public async Task<Result<List<PasswordResetRequestItem>>> GetPasswordResetRequestsAsync()
    {
        var now = DateTime.UtcNow;
        var items = await _db.WebCustomers
            .AsNoTracking()
            .Where(c => c.PasswordResetToken != null && c.PasswordResetExpiry > now)
            .OrderByDescending(c => c.PasswordResetExpiry)
            .Select(c => new PasswordResetRequestItem
            {
                CustomerId = c.Id,
                Email = c.Email,
                FullName = $"{c.FirstName} {c.LastName}",
                BusinessName = c.BusinessName,
                RequestedAt = c.PasswordResetExpiry!.Value.AddHours(-1), // token 1 saat geçerli
                ExpiresAt = c.PasswordResetExpiry!.Value
            })
            .ToListAsync();

        return Result<List<PasswordResetRequestItem>>.Ok(items);
    }

    public async Task<Result> DismissPasswordResetRequestAsync(int customerId)
    {
        var customer = await _db.WebCustomers.FindAsync(customerId);
        if (customer is null)
            return Result.Fail("Müşteri bulunamadı.");

        customer.PasswordResetToken = null;
        customer.PasswordResetExpiry = null;
        await _db.SaveChangesAsync();

        return Result.Ok("Talep kaldırıldı.");
    }

    public Result ChangeAdminPassword(string currentPassword, string newPassword)
    {
        var adminPassword = Environment.GetEnvironmentVariable("SITE_ADMIN_PASSWORD")
                            ?? _config["SiteAdmin:Password"];

        if (string.IsNullOrEmpty(adminPassword))
            return Result.Fail("Admin şifresi yapılandırılmamış.");

        if (currentPassword != adminPassword)
            return Result.Fail("Mevcut şifre hatalı.");

        // Config dosyasını güncelle
        var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json");
        if (File.Exists(configPath))
        {
            var json = File.ReadAllText(configPath);
            var doc = System.Text.Json.JsonDocument.Parse(json);
            using var stream = new MemoryStream();
            using (var writer = new System.Text.Json.Utf8JsonWriter(stream, new System.Text.Json.JsonWriterOptions { Indented = true }))
            {
                writer.WriteStartObject();
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    if (prop.Name == "SiteAdmin")
                    {
                        writer.WriteStartObject("SiteAdmin");
                        foreach (var sp in prop.Value.EnumerateObject())
                        {
                            if (sp.Name == "Password")
                                writer.WriteString("Password", newPassword);
                            else
                                sp.WriteTo(writer);
                        }
                        writer.WriteEndObject();
                    }
                    else
                    {
                        prop.WriteTo(writer);
                    }
                }
                writer.WriteEndObject();
            }
            File.WriteAllBytes(configPath, stream.ToArray());
        }

        _logger.LogInformation("Site admin şifresi değiştirildi.");
        return Result.Ok("Şifre başarıyla değiştirildi. Sunucu yeniden başlatıldığında yeni şifre aktif olur.");
    }
}
