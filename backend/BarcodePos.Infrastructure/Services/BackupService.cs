using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Backup;
using BarcodePos.Application.Interfaces;
using BarcodePos.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace BarcodePos.Infrastructure.Services;

public partial class BackupService : IBackupService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BackupService> _logger;
    private readonly string _dbPath;
    private readonly string _backupDir;

    // Dosya adı güvenlik kontrolü — sadece güvenli karakterler
    [GeneratedRegex(@"^[a-zA-Z0-9_\-\.]+$")]
    private static partial Regex SafeFileNameRegex();

    // SQLite dosya başlık imzası (ilk 16 byte)
    private static readonly byte[] SqliteHeader = "SQLite format 3\0"u8.ToArray();

    public BackupService(AppDbContext context, IConfiguration configuration, ILogger<BackupService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;

        // Connection string'den DB dosya yolunu çıkar
        var connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=BarcodePos.db";
        var builder = new SqliteConnectionStringBuilder(connectionString);
        _dbPath = Path.GetFullPath(builder.DataSource);

        // Yedek klasörü — DB dosyasının yanında backups/
        _backupDir = Path.Combine(Path.GetDirectoryName(_dbPath)!, "backups");
        Directory.CreateDirectory(_backupDir);
    }

    public async Task<Result<BackupResultDto>> CreateBackupAsync()
    {
        try
        {
            var timestamp = DateTime.Now.ToString("yyyy-MM-dd_HHmmss");
            var backupFileName = $"BarcodePos_{timestamp}.db";
            var backupPath = Path.Combine(_backupDir, backupFileName);

            // WAL modundaki bekleyen yazımları ana dosyaya aktar
            await _context.Database.ExecuteSqlRawAsync("PRAGMA wal_checkpoint(TRUNCATE);");

            // VACUUM INTO ile tutarlı bir kopya oluştur — tek tırnak escape ile SQL injection engellenir
            var sanitizedPath = backupPath.Replace("'", "''");
#pragma warning disable EF1002 // backupPath kullanıcı girdisi değil, timestamp'ten üretilir
            await _context.Database.ExecuteSqlRawAsync($"VACUUM INTO '{sanitizedPath}';");
#pragma warning restore EF1002

            var fileInfo = new FileInfo(backupPath);

            _logger.LogInformation("Yedek oluşturuldu: {FileName} ({Size} bytes)", backupFileName, fileInfo.Length);

            return Result<BackupResultDto>.Ok(new BackupResultDto
            {
                FileName = backupFileName,
                FileSizeBytes = fileInfo.Length,
                Message = "Yedek başarıyla oluşturuldu."
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yedek oluşturulurken hata oluştu");
            return Result<BackupResultDto>.Fail($"Yedek oluşturulamadı: {ex.Message}");
        }
    }

    public Task<Result<List<BackupInfoDto>>> GetBackupListAsync()
    {
        try
        {
            var backups = new DirectoryInfo(_backupDir)
                .GetFiles("*.db")
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
            var tempPath = Path.Combine(_backupDir, $"_upload_temp_{Guid.NewGuid()}.db");
            try
            {
                await using (var fs = new FileStream(tempPath, FileMode.Create, FileAccess.Write))
                {
                    await fileStream.CopyToAsync(fs);
                }

                // SQLite dosyası mı kontrol et
                if (!IsValidSqliteFile(tempPath))
                {
                    File.Delete(tempPath);
                    return Result<RestoreResultDto>.Fail("Geçersiz dosya. Lütfen geçerli bir SQLite veritabanı dosyası yükleyin.");
                }

                return await PerformRestoreAsync(tempPath);
            }
            finally
            {
                // Geçici dosyayı temizle
                if (File.Exists(tempPath))
                    File.Delete(tempPath);
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

            if (!IsValidSqliteFile(backupPath))
                return Result<RestoreResultDto>.Fail("Yedek dosyası geçerli bir SQLite veritabanı değil.");

            return await PerformRestoreAsync(backupPath);
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

    // ── Yardımcı Metotlar ──

    /// <summary>
    /// Geri yükleme işlemini gerçekleştirir:
    /// 1. Mevcut DB'yi otomatik yedekle (pre-restore)
    /// 2. EF Core bağlantısını kapat
    /// 3. Kaynak dosyayı aktif DB üzerine kopyala
    /// </summary>
    private async Task<Result<RestoreResultDto>> PerformRestoreAsync(string sourcePath)
    {
        // 1. Mevcut DB'yi otomatik yedekle
        var preRestoreFileName = $"BarcodePos_pre_restore_{DateTime.Now:yyyy-MM-dd_HHmmss}.db";
        var preRestorePath = Path.Combine(_backupDir, preRestoreFileName);
        File.Copy(_dbPath, preRestorePath, overwrite: true);
        _logger.LogInformation("Geri yükleme öncesi otomatik yedek alındı: {FileName}", preRestoreFileName);

        // 2. EF Core bağlantısını kapat — SQLite dosyası kilidi serbest kalsın
        var connection = _context.Database.GetDbConnection();
        await connection.CloseAsync();

        try
        {
            // 3. Kaynak dosyayı aktif DB üzerine kopyala
            File.Copy(sourcePath, _dbPath, overwrite: true);

            // WAL ve SHM dosyalarını temizle (varsa)
            var walPath = _dbPath + "-wal";
            var shmPath = _dbPath + "-shm";
            if (File.Exists(walPath)) File.Delete(walPath);
            if (File.Exists(shmPath)) File.Delete(shmPath);

            _logger.LogInformation("Veritabanı geri yüklendi: {Source}", Path.GetFileName(sourcePath));

            return Result<RestoreResultDto>.Ok(new RestoreResultDto
            {
                Message = "Veritabanı başarıyla geri yüklendi. Uygulama yeniden başlatılmalıdır.",
                PreRestoreBackupFileName = preRestoreFileName
            });
        }
        catch
        {
            // Hata durumunda bağlantıyı geri aç
            await connection.OpenAsync();
            throw;
        }
    }

    /// <summary>
    /// Dosya adı güvenlik kontrolü — path traversal engelleme.
    /// </summary>
    private static bool IsValidFileName(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return false;

        if (!SafeFileNameRegex().IsMatch(fileName))
            return false;

        if (!fileName.EndsWith(".db", StringComparison.OrdinalIgnoreCase))
            return false;

        // Path traversal kontrolü
        if (fileName.Contains("..") || fileName.Contains('/') || fileName.Contains('\\'))
            return false;

        return true;
    }

    /// <summary>
    /// SQLite dosya başlık imzası kontrolü — ilk 16 byte.
    /// </summary>
    private static bool IsValidSqliteFile(string filePath)
    {
        try
        {
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            if (fs.Length < 100) // SQLite minimum dosya boyutu
                return false;

            var header = new byte[16];
            _ = fs.Read(header, 0, 16);

            return header.AsSpan().SequenceEqual(SqliteHeader);
        }
        catch
        {
            return false;
        }
    }
}
