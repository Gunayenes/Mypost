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
        // EF Core — DbProvider: SqlServer (MSSQL) | Postgres | Sqlite (otomatik algıla)
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        var provider = DetectDbProvider(connectionString, configuration);

        services.AddDbContext<AppDbContext>(options =>
        {
            switch (provider)
            {
                case "SqlServer":
                    options.UseSqlServer(connectionString);
                    break;
                case "Postgres":
                    options.UseNpgsql(connectionString);
                    break;
                default:
                    options.UseSqlite(connectionString);
                    break;
            }
        });

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

    /// <summary>
    /// Connection string'e göre DB provider'ı algılar.
    /// Override: appsettings.json -> "DbProvider": "SqlServer" | "Postgres" | "Sqlite"
    /// </summary>
    private static string DetectDbProvider(string connectionString, IConfiguration configuration)
    {
        // Manuel override (appsettings veya env var)
        var explicitProvider = configuration["DbProvider"];
        if (!string.IsNullOrEmpty(explicitProvider)) return explicitProvider;

        if (string.IsNullOrEmpty(connectionString)) return "Sqlite";

        // PostgreSQL: Host= + Username= (User Id değil)
        if (connectionString.Contains("Host=", System.StringComparison.OrdinalIgnoreCase)
            && connectionString.Contains("Username=", System.StringComparison.OrdinalIgnoreCase))
            return "Postgres";

        // SQL Server: Server= veya Data Source=... (ve User Id= veya Integrated Security)
        if (connectionString.Contains("Server=", System.StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("Initial Catalog=", System.StringComparison.OrdinalIgnoreCase))
            return "SqlServer";

        // Data Source=dosya.db ise SQLite
        if (connectionString.Contains(".db", System.StringComparison.OrdinalIgnoreCase))
            return "Sqlite";

        return "Sqlite";
    }
}
