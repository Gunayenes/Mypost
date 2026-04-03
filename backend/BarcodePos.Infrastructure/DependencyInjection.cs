using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using BarcodePos.Infrastructure.Persistence;
using BarcodePos.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BarcodePos.Infrastructure;

/// <summary>
/// Infrastructure katmanı servis kayıtları.
/// Program.cs'de builder.Services.AddInfrastructure(configuration) olarak çağrılır.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // EF Core — PostgreSQL (cloud) veya SQLite (local/Electron)
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        if (connectionString.Contains("Host=") || connectionString.Contains("Server="))
        {
            // PostgreSQL
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(connectionString));
        }
        else
        {
            // SQLite (local/Electron)
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(connectionString));
        }

        // EF Core — License DB (LicenseManager ile paylaşılır)
        var licenseConnection = configuration.GetConnectionString("LicenseConnection") ?? "Data Source=licenses.db";
        services.AddDbContext<LicenseDbContext>(options =>
            options.UseSqlite(licenseConnection));

        // Repository ve UnitOfWork
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // CurrentUser — HttpContext claim'lerinden kullanıcı bilgisi okur
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        // Auth ve User servisleri
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();

        // Category ve Product servisleri
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IProductService, ProductService>();

        // Customer servisi
        services.AddScoped<ICustomerService, CustomerService>();

        // StockMovement servisi
        services.AddScoped<IStockMovementService, StockMovementService>();

        // Sale servisi
        services.AddScoped<ISaleService, SaleService>();

        // Report ve Excel servisleri
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IExcelExportService, ExcelExportService>();

        // Backup servisi
        services.AddScoped<IBackupService, BackupService>();

        // Servis yönetim modülü
        services.AddScoped<IServiceRecordService, ServiceRecordService>();

        // Web auth servisi
        services.AddScoped<IWebAuthService, WebAuthService>();

        // Site admin servisi
        services.AddScoped<ISiteAdminService, SiteAdminService>();

        // E-posta servisi
        services.AddSingleton<IEmailService, EmailService>();

        return services;
    }
}
