using Microsoft.EntityFrameworkCore;

namespace BarcodePos.Infrastructure.Persistence;

/// <summary>
/// Lisans yönetimi için ayrı DbContext. licenses.db dosyasına bağlanır.
/// LicenseManager tool ile aynı veritabanını paylaşır.
/// </summary>
public class LicenseDbContext : DbContext
{
    public DbSet<LicenseRecord> Licenses => Set<LicenseRecord>();

    public LicenseDbContext(DbContextOptions<LicenseDbContext> options) : base(options) { }
}

public class LicenseRecord
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string MachineId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string LicenseKey { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}
