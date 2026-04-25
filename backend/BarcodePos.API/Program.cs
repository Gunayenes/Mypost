using BarcodePos.API.Middleware;
using BarcodePos.Application;
using BarcodePos.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using System.Threading.RateLimiting;

// ── Serilog erken başlatma (uygulama başlamadan önce loglama aktif) ──
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Cari Soft API başlatılıyor...");

    // ── .env dosyasından ortam değişkenlerini yükle ──
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    if (File.Exists(envPath))
    {
        foreach (var line in File.ReadAllLines(envPath))
        {
            var trimmed = line.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
            var idx = trimmed.IndexOf('=');
            if (idx <= 0) continue;
            var key = trimmed[..idx].Trim();
            var val = trimmed[(idx + 1)..].Trim();
            if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
                Environment.SetEnvironmentVariable(key, val);
        }
    }

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog konfigürasyonu (appsettings.json'dan okur) ──
    builder.Host.UseSerilog((context, loggerConfig) =>
    {
        loggerConfig
            .ReadFrom.Configuration(context.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "Cari Soft")
            .WriteTo.Console()
            .WriteTo.File(
                path: "logs/barcodepos-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30);
    });

    // ── Katman servis kayıtları ──
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // ── Controller'lar ──
    builder.Services.AddControllers();

    // ── OpenAPI / Swagger ──
    builder.Services.AddOpenApi();

    // ── CORS — Config-driven (Dev & Production) ──
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            var origins = builder.Configuration.GetValue<string>("AllowedOrigins");
            if (!string.IsNullOrEmpty(origins))
            {
                policy.WithOrigins(origins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
            }
            else
            {
                // Geliştirme ortamı varsayılanları
                policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:4173");
            }
            policy.WithHeaders("Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With")
                  .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                  .AllowCredentials();
        });
    });

    // ── Authentication & Authorization — JWT Bearer ──
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
                    ?? jwtSettings["Secret"]
                    ?? throw new InvalidOperationException("JWT Secret yapılandırılmamış. JWT_SECRET env var veya JwtSettings:Secret ayarlayın.");
    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
    builder.Services.AddAuthorization();

    // ── Health Check ──
    builder.Services.AddHealthChecks();
    builder.Services.AddHttpClient();

    // ── Rate Limiting ──
    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        // Login endpoint'leri: IP başına 5 istek / 15 dakika
        options.AddPolicy("login", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0
                }));

        // Public endpoint'ler (servis takip vb.): IP başına 20 istek / dakika
        options.AddPolicy("public", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

        // Upload endpoint'leri: IP başına 10 istek / dakika
        options.AddPolicy("upload", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));
    });

    // ── Cloud PORT desteği (Render/Railway) ──
    // ConfigureKestrel en yüksek öncelik — appsettings Kestrel config'ini ezer
    var port = Environment.GetEnvironmentVariable("PORT");
    if (!string.IsNullOrEmpty(port))
    {
        builder.WebHost.ConfigureKestrel(options =>
        {
            options.ListenAnyIP(int.Parse(port));
        });
    }

    var app = builder.Build();

    // ── License DB — sadece Electron/lokal kurulumlarda gerekli ──
    // Cloud/Plesk ortamında DISABLE_LICENSE_CHECK=true ise atla
    var disableLicense = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("DISABLE_LICENSE_CHECK"));
    if (!disableLicense)
    {
        try
        {
            using var initScope = app.Services.CreateScope();
            var licenseDb = initScope.ServiceProvider.GetRequiredService<BarcodePos.Infrastructure.Persistence.LicenseDbContext>();
            licenseDb.Database.EnsureCreated();
        }
        catch (Exception ex)
        {
            Log.Warning("License DB başlatılamadı (web ortamında normal): {Message}", ex.Message);
        }
    }

    // ── Otomatik DB kurulumu (Provider'a göre Migrate vs EnsureCreated) ──
    if (args.Contains("--migrate") || !app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BarcodePos.Infrastructure.Persistence.AppDbContext>();
        var providerName = db.Database.ProviderName ?? "";

        // SQLite migration'ları TEXT column tipiyle üretildi, SQL Server/PostgreSQL'de cast hatası verir.
        // Bu yüzden MSSQL/Postgres için EnsureCreated (fluent config'ten schema oluştur).
        if (providerName.Contains("Sqlite"))
        {
            db.Database.Migrate();
            Log.Information("SQLite migration'ları uygulandı.");
        }
        else
        {
            db.Database.EnsureCreated();
            Log.Information("DB schema oluşturuldu (EnsureCreated). Provider: {Provider}", providerName);
        }

        // Özel SQL migration'ları (DbMigrations/*.sql) çalıştır — her deploy'da yeni dosyalar uygulanır
        var migrationsDir = Path.Combine(AppContext.BaseDirectory, "DbMigrations");
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        try
        {
            BarcodePos.Infrastructure.Persistence.CustomMigrationRunner
                .RunAsync(db, migrationsDir, logger).GetAwaiter().GetResult();
        }
        catch (Exception mex)
        {
            Log.Error(mex, "Özel SQL migration'ları uygulanırken hata oluştu. Uygulama devam ediyor.");
        }

        if (args.Contains("--migrate"))
        {
            Log.Information("Migration tamamlandı. Uygulama kapatılıyor.");
            return;
        }
    }

    // ── Middleware pipeline ──
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseSerilogRequestLogging(options =>
    {
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("UserId", httpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "anonymous");
            diagnosticContext.Set("UserRole", httpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "-");
            diagnosticContext.Set("ClientIP", httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown");
        };
        options.MessageTemplate = "{RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0}ms | User: {UserId} ({UserRole}) | IP: {ClientIP}";
    });

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", "Cari Soft API v1");
            options.DocumentTitle = "Cari Soft API - Swagger UI";
        });
    }

    // HTTPS redirect — Cloud (Railway/Docker) ortamında devre dışı (reverse proxy handle eder)
    if (!app.Environment.IsDevelopment() && string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PORT")))
    {
        app.UseHttpsRedirection();
    }
    app.UseCors("AllowFrontend");
    app.UseRateLimiter();

    // ── Güvenlik Header'ları ──
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        if (!app.Environment.IsDevelopment())
        {
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }
        await next();
    });

    // ── Lisans kontrolü — her API isteğinde lisansı doğrular ──
    app.UseMiddleware<LicenseCheckMiddleware>();

    // ── Static dosyalar (uploads her zaman, frontend sadece production) ──
    app.UseStaticFiles(); // uploads/logos vb. her ortamda erişilebilir
    if (!app.Environment.IsDevelopment())
    {
        app.UseDefaultFiles();
    }

    app.UseAuthentication();
    app.UseAuthorization();

    // ── Abonelik kontrolü — aktif abonelik yoksa POS API'yi kısıtlar ──
    app.UseMiddleware<SubscriptionCheckMiddleware>();

    app.MapControllers();
    app.MapHealthChecks("/health");

    // SPA fallback — React Router desteği (API dışı tüm istekleri index.html'e yönlendir)
    if (!app.Environment.IsDevelopment())
    {
        app.MapFallbackToFile("index.html");
    }

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Uygulama başlatılırken kritik hata oluştu.");
}
finally
{
    Log.CloseAndFlush();
}
