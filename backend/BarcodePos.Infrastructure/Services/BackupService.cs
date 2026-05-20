using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Backup;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Entities;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace BarcodePos.Infrastructure.Services;

public partial class BackupService : IBackupService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BackupService> _logger;
    private readonly string _dbPath;
    private readonly string _backupDir;
    private readonly bool _isSqlite;
    private readonly bool _isSqlServer;

    [GeneratedRegex(@"^[a-zA-Z0-9_\-\.]+$")]
    private static partial Regex SafeFileNameRegex();

    private static readonly byte[] SqliteHeader = "SQLite format 3\0"u8.ToArray();

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public BackupService(AppDbContext context, IConfiguration configuration, ILogger<BackupService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;

        var connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=BarcodePos.db";
        var providerName = _context.Database.ProviderName ?? string.Empty;
        _isSqlite = providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);
        _isSqlServer = providerName.Contains("SqlServer", StringComparison.OrdinalIgnoreCase);

        if (_isSqlite)
        {
            var builder = new SqliteConnectionStringBuilder(connectionString);
            _dbPath = Path.GetFullPath(builder.DataSource);
            _backupDir = Path.Combine(Path.GetDirectoryName(_dbPath)!, "backups");
        }
        else
        {
            _dbPath = string.Empty;
            _backupDir = Path.Combine(AppContext.BaseDirectory, "backups");
        }
        Directory.CreateDirectory(_backupDir);
    }

    public async Task<Result<BackupResultDto>> CreateBackupAsync()
    {
        if (_isSqlite) return await CreateSqliteBackupAsync();
        if (_isSqlServer) return await CreateJsonBackupAsync();
        return Result<BackupResultDto>.Fail("Bu veritabanı sağlayıcısı için yedekleme desteklenmiyor.");
    }

    private async Task<Result<BackupResultDto>> CreateSqliteBackupAsync()
    {
        try
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
            var backupFileName = $"BarcodePos_{timestamp}.db";
            var backupPath = Path.Combine(_backupDir, backupFileName);

            await _context.Database.ExecuteSqlRawAsync("PRAGMA wal_checkpoint(TRUNCATE);");
            var sanitizedPath = backupPath.Replace("'", "''");
#pragma warning disable EF1002
            await _context.Database.ExecuteSqlRawAsync($"VACUUM INTO '{sanitizedPath}';");
#pragma warning restore EF1002

            var fileInfo = new FileInfo(backupPath);
            _logger.LogInformation("SQLite yedek oluşturuldu: {FileName} ({Size} bytes)", backupFileName, fileInfo.Length);

            return Result<BackupResultDto>.Ok(new BackupResultDto
            {
                FileName = backupFileName,
                FileSizeBytes = fileInfo.Length,
                Message = "Yedek başarıyla oluşturuldu."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SQLite yedek oluşturulurken hata oluştu");
            return Result<BackupResultDto>.Fail($"Yedek oluşturulamadı: {ex.Message}");
        }
    }

    private async Task<Result<BackupResultDto>> CreateJsonBackupAsync()
    {
        try
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
            var fileName = $"BarcodePos_{timestamp}.json";
            var path = Path.Combine(_backupDir, fileName);

            var data = await ReadAllDataAsync();

            await using var fs = new FileStream(path, FileMode.Create, FileAccess.Write);
            await JsonSerializer.SerializeAsync(fs, data, JsonOpts);

            var fi = new FileInfo(path);
            _logger.LogInformation("JSON yedek oluşturuldu: {FileName} ({Size} bytes)", fileName, fi.Length);

            return Result<BackupResultDto>.Ok(new BackupResultDto
            {
                FileName = fileName,
                FileSizeBytes = fi.Length,
                Message = "Yedek başarıyla oluşturuldu."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "JSON yedek oluşturulurken hata oluştu");
            return Result<BackupResultDto>.Fail($"Yedek oluşturulamadı: {ex.Message}");
        }
    }

    private async Task<JsonBackupData> ReadAllDataAsync()
    {
        return new JsonBackupData
        {
            Version = "1.0",
            ExportedAt = DateTime.UtcNow,
            Stores = await _context.Stores.AsNoTracking().ToListAsync(),
            SubscriptionPlans = await _context.SubscriptionPlans.AsNoTracking().ToListAsync(),
            Users = await _context.Users.AsNoTracking().ToListAsync(),
            Categories = await _context.Categories.AsNoTracking().ToListAsync(),
            Customers = await _context.Customers.AsNoTracking().ToListAsync(),
            WebCustomers = await _context.WebCustomers.AsNoTracking().ToListAsync(),
            Subscriptions = await _context.Subscriptions.AsNoTracking().ToListAsync(),
            Products = await _context.Products.AsNoTracking().ToListAsync(),
            Sales = await _context.Sales.AsNoTracking().ToListAsync(),
            SaleItems = await _context.SaleItems.AsNoTracking().ToListAsync(),
            StockMovements = await _context.StockMovements.AsNoTracking().ToListAsync(),
            CustomerTransactions = await _context.CustomerTransactions.AsNoTracking().ToListAsync(),
            ServiceRecords = await _context.ServiceRecords.AsNoTracking().ToListAsync(),
            ServiceLogs = await _context.ServiceLogs.AsNoTracking().ToListAsync(),
            ServiceParts = await _context.ServiceParts.AsNoTracking().ToListAsync(),
            ContactMessages = await _context.ContactMessages.AsNoTracking().ToListAsync(),
        };
    }

    public Task<Result<List<BackupInfoDto>>> GetBackupListAsync()
    {
        try
        {
            var dir = new DirectoryInfo(_backupDir);
            var backups = dir.GetFiles("*.db").Concat(dir.GetFiles("*.json"))
                .OrderByDescending(f => f.CreationTime)
                .Select(f => new BackupInfoDto
                {
                    FileName = f.Name,
                    FileSizeBytes = f.Length,
                    CreatedAt = f.CreationTime
                })
                .ToList();

            return Task.FromResult(Result<List<BackupInfoDto>>.Ok(backups));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yedek listesi alınırken hata oluştu");
            return Task.FromResult(Result<List<BackupInfoDto>>.Fail($"Yedek listesi alınamadı: {ex.Message}"));
        }
    }

    public async Task<Result<RestoreResultDto>> RestoreFromFileAsync(Stream fileStream)
    {
        try
        {
            // Yüklenen dosyayı geçici konuma kaydet
            var tempPath = Path.Combine(_backupDir, $"_upload_temp_{Guid.NewGuid()}.tmp");
            try
            {
                await using (var fs = new FileStream(tempPath, FileMode.Create, FileAccess.Write))
                {
                    await fileStream.CopyToAsync(fs);
                }

                // Dosya tipini tespit et
                if (IsValidSqliteFile(tempPath))
                {
                    if (!_isSqlite)
                        return Result<RestoreResultDto>.Fail("Bu sunucu MSSQL kullanıyor; SQLite yedeği geri yüklenemez.");
                    return await PerformSqliteRestoreAsync(tempPath);
                }
                if (await IsValidJsonBackupAsync(tempPath))
                {
                    // JSON yedek her iki provider'a da geri yüklenebilir
                    return _isSqlite
                        ? await PerformJsonRestoreForSqliteAsync(tempPath)
                        : await PerformJsonRestoreAsync(tempPath);
                }
                return Result<RestoreResultDto>.Fail("Geçersiz dosya. Lütfen geçerli bir yedek dosyası yükleyin (.db veya .json).");
            }
            finally
            {
                if (File.Exists(tempPath)) File.Delete(tempPath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dosyadan geri yükleme sırasında hata oluştu");
            return Result<RestoreResultDto>.Fail($"Geri yükleme başarısız: {ex.Message}");
        }
    }

    public async Task<Result<RestoreResultDto>> RestoreFromExistingAsync(string fileName)
    {
        try
        {
            if (!IsValidFileName(fileName))
                return Result<RestoreResultDto>.Fail("Geçersiz dosya adı.");

            var backupPath = Path.Combine(_backupDir, fileName);
            if (!File.Exists(backupPath))
                return Result<RestoreResultDto>.Fail("Yedek dosyası bulunamadı.");

            if (fileName.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
            {
                if (!_isSqlite)
                    return Result<RestoreResultDto>.Fail("Bu sunucu MSSQL kullanıyor; SQLite (.db) yedeği geri yüklenemez.");
                if (!IsValidSqliteFile(backupPath))
                    return Result<RestoreResultDto>.Fail("Yedek dosyası geçerli bir SQLite veritabanı değil.");
                return await PerformSqliteRestoreAsync(backupPath);
            }

            if (fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
            {
                if (!await IsValidJsonBackupAsync(backupPath))
                    return Result<RestoreResultDto>.Fail("Yedek dosyası geçerli bir JSON yedeği değil.");
                return _isSqlite
                    ? await PerformJsonRestoreForSqliteAsync(backupPath)
                    : await PerformJsonRestoreAsync(backupPath);
            }

            return Result<RestoreResultDto>.Fail("Desteklenmeyen yedek formatı.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Mevcut yedekten geri yükleme sırasında hata oluştu: {FileName}", fileName);
            return Result<RestoreResultDto>.Fail($"Geri yükleme başarısız: {ex.Message}");
        }
    }

    public Task<Result> DeleteBackupAsync(string fileName)
    {
        try
        {
            if (!IsValidFileName(fileName))
                return Task.FromResult(Result.Fail("Geçersiz dosya adı."));

            var filePath = Path.Combine(_backupDir, fileName);
            if (!File.Exists(filePath))
                return Task.FromResult(Result.Fail("Yedek dosyası bulunamadı."));

            File.Delete(filePath);
            _logger.LogInformation("Yedek silindi: {FileName}", fileName);
            return Task.FromResult(Result.Ok("Yedek başarıyla silindi."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yedek silinirken hata oluştu: {FileName}", fileName);
            return Task.FromResult(Result.Fail($"Yedek silinemedi: {ex.Message}"));
        }
    }

    public Task<Result<(Stream FileStream, string FileName)>> GetBackupFileAsync(string fileName)
    {
        try
        {
            if (!IsValidFileName(fileName))
                return Task.FromResult(Result<(Stream FileStream, string FileName)>.Fail("Geçersiz dosya adı."));

            var filePath = Path.Combine(_backupDir, fileName);
            if (!File.Exists(filePath))
                return Task.FromResult(Result<(Stream FileStream, string FileName)>.Fail("Yedek dosyası bulunamadı."));

            var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult(Result<(Stream, string)>.Ok((stream as Stream, fileName)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yedek dosyası okunurken hata oluştu: {FileName}", fileName);
            return Task.FromResult(Result<(Stream FileStream, string FileName)>.Fail($"Dosya okunamadı: {ex.Message}"));
        }
    }

    // ── SQLite restore (mevcut) ──

    private async Task<Result<RestoreResultDto>> PerformSqliteRestoreAsync(string sourcePath)
    {
        var preRestoreFileName = $"BarcodePos_pre_restore_{DateTime.Now:yyyy-MM-dd_HHmmss}.db";
        var preRestorePath = Path.Combine(_backupDir, preRestoreFileName);
        File.Copy(_dbPath, preRestorePath, overwrite: true);

        var connection = _context.Database.GetDbConnection();
        await connection.CloseAsync();

        try
        {
            File.Copy(sourcePath, _dbPath, overwrite: true);
            var walPath = _dbPath + "-wal";
            var shmPath = _dbPath + "-shm";
            if (File.Exists(walPath)) File.Delete(walPath);
            if (File.Exists(shmPath)) File.Delete(shmPath);

            return Result<RestoreResultDto>.Ok(new RestoreResultDto
            {
                Message = "Veritabanı başarıyla geri yüklendi. Uygulama yeniden başlatılmalıdır.",
                PreRestoreBackupFileName = preRestoreFileName
            });
        }
        catch
        {
            await connection.OpenAsync();
            throw;
        }
    }

    // ── JSON restore (MSSQL) ──

    private async Task<Result<RestoreResultDto>> PerformJsonRestoreAsync(string sourcePath)
    {
        // Önce mevcut veriden bir yedek al (geri dönüş için)
        var preRestore = await CreateJsonBackupAsync();
        var preRestoreFileName = preRestore.Success ? preRestore.Data!.FileName : null;

        // JSON'u oku
        await using var fs = new FileStream(sourcePath, FileMode.Open, FileAccess.Read);
        var data = await JsonSerializer.DeserializeAsync<JsonBackupData>(fs, JsonOpts)
            ?? throw new InvalidOperationException("JSON yedeği okunamadı.");

        // Tek bir transaction içinde:
        //   1) FK kontrollerini geçici olarak kapat
        //   2) Tüm tabloları sil
        //   3) IDENTITY_INSERT ON ile veriyi yeniden yaz
        //   4) FK kontrollerini geri aç
        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1) FK constraint'leri kapat
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL'");

            // 2) Tabloları temizle (child → parent sırası)
            string[] deleteOrder = [
                nameof(_context.ServiceParts), nameof(_context.ServiceLogs), nameof(_context.ServiceRecords),
                nameof(_context.ContactMessages),
                nameof(_context.CustomerTransactions),
                nameof(_context.StockMovements),
                nameof(_context.SaleItems), nameof(_context.Sales),
                nameof(_context.Products),
                nameof(_context.Subscriptions), nameof(_context.WebCustomers),
                nameof(_context.Customers), nameof(_context.Categories),
                nameof(_context.Users),
                nameof(_context.SubscriptionPlans),
                nameof(_context.Stores),
            ];
#pragma warning disable EF1002 // tablo adları nameof() ile elde ediliyor — kullanıcı girdisi değil
            foreach (var t in deleteOrder)
                await _context.Database.ExecuteSqlRawAsync($"DELETE FROM [{t}]");
#pragma warning restore EF1002

            // 3) Veriyi yeniden yaz (parent → child)
            await BulkInsertAsync(_context.Stores, data.Stores);
            await BulkInsertAsync(_context.SubscriptionPlans, data.SubscriptionPlans);
            await BulkInsertAsync(_context.Users, data.Users);
            await BulkInsertAsync(_context.Categories, data.Categories);
            await BulkInsertAsync(_context.Customers, data.Customers);
            await BulkInsertAsync(_context.WebCustomers, data.WebCustomers);
            await BulkInsertAsync(_context.Subscriptions, data.Subscriptions);
            await BulkInsertAsync(_context.Products, data.Products);
            await BulkInsertAsync(_context.Sales, data.Sales);
            await BulkInsertAsync(_context.SaleItems, data.SaleItems);
            await BulkInsertAsync(_context.StockMovements, data.StockMovements);
            await BulkInsertAsync(_context.CustomerTransactions, data.CustomerTransactions);
            await BulkInsertAsync(_context.ServiceRecords, data.ServiceRecords);
            await BulkInsertAsync(_context.ServiceLogs, data.ServiceLogs);
            await BulkInsertAsync(_context.ServiceParts, data.ServiceParts);
            await BulkInsertAsync(_context.ContactMessages, data.ContactMessages);

            // 4) FK constraint'leri geri aç
            await _context.Database.ExecuteSqlRawAsync(
                "EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'");

            await tx.CommitAsync();

            _logger.LogInformation("JSON yedekten geri yükleme tamamlandı: {Source}", Path.GetFileName(sourcePath));
            return Result<RestoreResultDto>.Ok(new RestoreResultDto
            {
                Message = "Veritabanı başarıyla geri yüklendi.",
                PreRestoreBackupFileName = preRestoreFileName
            });
        }
        catch
        {
            await tx.RollbackAsync();
            // Constraint'leri yine de açmaya çalış (hata sonrası)
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "EXEC sp_MSforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL'");
            }
            catch { /* sessiz */ }
            throw;
        }
    }

    // ── SQLite JSON restore (masaüstü uygulamasi icin) ──

    /// <summary>
    /// JSON yedek dosyasını SQLite veritabanına geri yükler.
    /// SQLite'da IDENTITY_INSERT yoktur — Id'ler doğrudan insert sırasında verilirse korunur.
    /// </summary>
    private async Task<Result<RestoreResultDto>> PerformJsonRestoreForSqliteAsync(string sourcePath)
    {
        // Önce mevcut veriden bir yedek al
        string? preRestoreFileName = null;
        try
        {
            var preRestore = await CreateJsonBackupAsync();
            if (preRestore.Success) preRestoreFileName = preRestore.Data!.FileName;
        }
        catch { /* preRestore başarısız olsa bile devam et */ }

        // JSON'u oku
        await using var fs = new FileStream(sourcePath, FileMode.Open, FileAccess.Read);
        var data = await JsonSerializer.DeserializeAsync<JsonBackupData>(fs, JsonOpts)
            ?? throw new InvalidOperationException("JSON yedeği okunamadı.");

        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1) Foreign key kontrollerini geçici kapat (SQLite syntax)
            await _context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");

            // 2) Tüm tabloları temizle (child → parent)
            string[] deleteOrder = [
                nameof(_context.ServiceParts), nameof(_context.ServiceLogs), nameof(_context.ServiceRecords),
                nameof(_context.ContactMessages),
                nameof(_context.CustomerTransactions),
                nameof(_context.StockMovements),
                nameof(_context.SaleItems), nameof(_context.Sales),
                nameof(_context.Products),
                nameof(_context.Subscriptions), nameof(_context.WebCustomers),
                nameof(_context.Customers), nameof(_context.Categories),
                nameof(_context.Users),
                nameof(_context.SubscriptionPlans),
                nameof(_context.Stores),
            ];
#pragma warning disable EF1002 // tablo adları nameof() ile elde ediliyor
            foreach (var t in deleteOrder)
                await _context.Database.ExecuteSqlRawAsync($"DELETE FROM \"{t}\"");
            // sqlite_sequence'i de sıfırla (autoincrement reset)
            try
            {
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence");
            }
            catch { /* sqlite_sequence olmayabilir, normal */ }
#pragma warning restore EF1002

            // 3) Veriyi yeniden yaz (parent → child) — SQLite'da Id verince doğrudan kullanır
            await SqliteBulkInsertAsync(_context.Stores, data.Stores);
            await SqliteBulkInsertAsync(_context.SubscriptionPlans, data.SubscriptionPlans);
            await SqliteBulkInsertAsync(_context.Users, data.Users);
            await SqliteBulkInsertAsync(_context.Categories, data.Categories);
            await SqliteBulkInsertAsync(_context.Customers, data.Customers);
            await SqliteBulkInsertAsync(_context.WebCustomers, data.WebCustomers);
            await SqliteBulkInsertAsync(_context.Subscriptions, data.Subscriptions);
            await SqliteBulkInsertAsync(_context.Products, data.Products);
            await SqliteBulkInsertAsync(_context.Sales, data.Sales);
            await SqliteBulkInsertAsync(_context.SaleItems, data.SaleItems);
            await SqliteBulkInsertAsync(_context.StockMovements, data.StockMovements);
            await SqliteBulkInsertAsync(_context.CustomerTransactions, data.CustomerTransactions);
            await SqliteBulkInsertAsync(_context.ServiceRecords, data.ServiceRecords);
            await SqliteBulkInsertAsync(_context.ServiceLogs, data.ServiceLogs);
            await SqliteBulkInsertAsync(_context.ServiceParts, data.ServiceParts);
            await SqliteBulkInsertAsync(_context.ContactMessages, data.ContactMessages);

            // 4) FK kontrollerini geri aç
            await _context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;");

            await tx.CommitAsync();

            _logger.LogInformation("JSON yedekten SQLite'a geri yükleme tamamlandı: {Source}", Path.GetFileName(sourcePath));
            return Result<RestoreResultDto>.Ok(new RestoreResultDto
            {
                Message = $"Veritabanı başarıyla geri yüklendi. " +
                         $"({data.Products.Count} ürün, {data.Customers.Count} müşteri, {data.Sales.Count} satış)",
                PreRestoreBackupFileName = preRestoreFileName
            });
        }
        catch
        {
            await tx.RollbackAsync();
            try { await _context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;"); }
            catch { /* hata sonrası best-effort, foreign_keys zaten kapatmış olabilir */ }
            throw;
        }
    }

    /// <summary>
    /// SQLite için bulk insert. EF Core entity Add ile Id korunur (SQLite ROWID üzerine yazılır).
    /// </summary>
    private async Task SqliteBulkInsertAsync<T>(DbSet<T> dbSet, List<T>? items) where T : class
    {
        if (items is null || items.Count == 0) return;

        foreach (var item in items)
            dbSet.Add(item);

        await _context.SaveChangesAsync();

        // Eklenenleri detach et — bir sonraki tablo için ChangeTracker temiz başlasın
        foreach (var item in items)
            _context.Entry(item).State = EntityState.Detached;
    }

    /// <summary>
    /// MSSQL'e IDENTITY_INSERT ON ile birden fazla satır ekler.
    /// EF Core'un ChangeTracker'ı üzerinden gider — Id'ler korunur.
    /// </summary>
    private async Task BulkInsertAsync<T>(DbSet<T> dbSet, List<T>? items) where T : class
    {
        if (items is null || items.Count == 0) return;

        var entityType = _context.Model.FindEntityType(typeof(T));
        var tableName = entityType?.GetTableName() ?? typeof(T).Name;

        // Identity column varsa IDENTITY_INSERT ON
        var hasIdentity = entityType?.GetProperties().Any(p =>
            Microsoft.EntityFrameworkCore.SqlServerPropertyExtensions.GetValueGenerationStrategy(p)
                == Microsoft.EntityFrameworkCore.Metadata.SqlServerValueGenerationStrategy.IdentityColumn) ?? false;

#pragma warning disable EF1002 // tableName EF Core'dan geliyor — kullanıcı girdisi değil
        if (hasIdentity)
            await _context.Database.ExecuteSqlRawAsync($"SET IDENTITY_INSERT [{tableName}] ON");

        try
        {
            // Geçici olarak Id'lerin generated olmadığını söyle
            foreach (var item in items)
            {
                var entry = _context.Entry(item);
                entry.State = EntityState.Added;
            }
            await _context.SaveChangesAsync();
            // Track edilen entity'leri detach et — bir sonraki tablo için temiz başlasın
            foreach (var item in items)
                _context.Entry(item).State = EntityState.Detached;
        }
        finally
        {
            if (hasIdentity)
                await _context.Database.ExecuteSqlRawAsync($"SET IDENTITY_INSERT [{tableName}] OFF");
        }
#pragma warning restore EF1002
    }

    // ── Doğrulama yardımcıları ──

    private static bool IsValidFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;
        if (!SafeFileNameRegex().IsMatch(fileName)) return false;
        if (!fileName.EndsWith(".db", StringComparison.OrdinalIgnoreCase)
            && !fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) return false;
        if (fileName.Contains("..") || fileName.Contains('/') || fileName.Contains('\\')) return false;
        return true;
    }

    private static bool IsValidSqliteFile(string filePath)
    {
        try
        {
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            if (fs.Length < 100) return false;
            var header = new byte[16];
            _ = fs.Read(header, 0, 16);
            return header.AsSpan().SequenceEqual(SqliteHeader);
        }
        catch { return false; }
    }

    private static async Task<bool> IsValidJsonBackupAsync(string filePath)
    {
        try
        {
            await using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            var data = await JsonSerializer.DeserializeAsync<JsonBackupData>(fs, JsonOpts);
            return data is not null && !string.IsNullOrEmpty(data.Version);
        }
        catch { return false; }
    }
}

/// <summary>
/// JSON yedek dosyasının şeması. Tüm tablolar düz liste olarak tutulur.
/// </summary>
internal class JsonBackupData
{
    public string Version { get; set; } = "1.0";
    public DateTime ExportedAt { get; set; }
    public List<Store> Stores { get; set; } = [];
    public List<SubscriptionPlan> SubscriptionPlans { get; set; } = [];
    public List<User> Users { get; set; } = [];
    public List<Category> Categories { get; set; } = [];
    public List<Customer> Customers { get; set; } = [];
    public List<WebCustomer> WebCustomers { get; set; } = [];
    public List<Subscription> Subscriptions { get; set; } = [];
    public List<Product> Products { get; set; } = [];
    public List<Sale> Sales { get; set; } = [];
    public List<SaleItem> SaleItems { get; set; } = [];
    public List<StockMovement> StockMovements { get; set; } = [];
    public List<CustomerTransaction> CustomerTransactions { get; set; } = [];
    public List<ServiceRecord> ServiceRecords { get; set; } = [];
    public List<ServiceLog> ServiceLogs { get; set; } = [];
    public List<ServicePart> ServiceParts { get; set; } = [];
    public List<ContactMessage> ContactMessages { get; set; } = [];
}
