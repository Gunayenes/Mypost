using Microsoft.EntityFrameworkCore;

namespace LicenseManager;

public class LicenseDbContext : DbContext
{
    public DbSet<LicenseRecord> Licenses => Set<LicenseRecord>();

    protected override void OnConfiguring(DbContextOptionsBuilder options)
        => options.UseSqlite("Data Source=licenses.db");
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
