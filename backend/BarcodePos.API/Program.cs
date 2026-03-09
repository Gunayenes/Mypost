using BarcodePos.API.Middleware;
using BarcodePos.Application;
using BarcodePos.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;

// ── Serilog erken başlatma (uygulama başlamadan önce loglama aktif) ──
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("KasaPlus API başlatılıyor...");

    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog konfigürasyonu (appsettings.json'dan okur) ──
    builder.Host.UseSerilog((context, loggerConfig) =>
    {
        loggerConfig
            .ReadFrom.Configuration(context.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Application", "KasaPlus")
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
                policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:4173");
            }
            policy.AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    // ── Authentication & Authorization — JWT Bearer ──
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
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
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["Secret"]!))
        };
    });
    builder.Services.AddAuthorization();

    // ── Health Check ──
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    // ── Otomatik Migration (--migrate argümanı veya Production ilk çalıştırma) ──
    if (args.Contains("--migrate") || !app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BarcodePos.Infrastructure.Persistence.AppDbContext>();
        db.Database.Migrate();
        Log.Information("Veritabanı migration uygulandı.");

        if (args.Contains("--migrate"))
        {
            Log.Information("Migration tamamlandı. Uygulama kapatılıyor.");
            return;
        }
    }

    // ── Middleware pipeline ──
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", "KasaPlus API v1");
            options.DocumentTitle = "KasaPlus API - Swagger UI";
        });
    }

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }
    app.UseCors("AllowFrontend");

    // ── Lisans kontrolü — her API isteğinde lisansı doğrular ──
    app.UseMiddleware<LicenseCheckMiddleware>();

    // ── Production'da frontend static dosyalarını serve et ──
    if (!app.Environment.IsDevelopment())
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();
    }

    app.UseAuthentication();
    app.UseAuthorization();

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
