using BarcodePos.Domain.Common;
using BarcodePos.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Persistence;

/// <summary>
/// Ana veritabanı bağlam sınıfı. Tüm DbSet'ler ve konfigürasyonlar burada tanımlanır.
/// AuditableEntity'ler için UpdatedAt otomatik set edilir.
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Store> Stores => Set<Store>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerTransaction> CustomerTransactions => Set<CustomerTransaction>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    // Servis modülü
    public DbSet<ServiceRecord> ServiceRecords => Set<ServiceRecord>();
    public DbSet<ServiceLog> ServiceLogs => Set<ServiceLog>();
    public DbSet<ServicePart> ServiceParts => Set<ServicePart>();

    // Web platform
    public DbSet<WebCustomer> WebCustomers => Set<WebCustomer>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Infrastructure/Persistence/Configurations altındaki tüm konfigürasyonları uygula
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // AuditableEntity'ler için UpdatedAt otomatik güncelle
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        // Yeni eklenen BaseEntity'ler için CreatedAt set et
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
