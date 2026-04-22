using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BarcodePos.Infrastructure.Persistence;

/// <summary>
/// Uygulama her başladığında DbMigrations/ klasöründeki SQL dosyalarını
/// sırayla çalıştırır. Hangisi uygulandı takibi __CustomMigrations tablosunda tutulur.
///
/// Kullanım: DbMigrations/ klasörüne 001_ornek.sql, 002_kolon_ekle.sql gibi dosyalar ekle.
/// Her deploy'da yeni dosyalar otomatik uygulanır, eski dosyalar tekrar çalışmaz.
/// </summary>
public static class CustomMigrationRunner
{
    private const string MigrationsTable = "__CustomMigrations";

    public static async Task RunAsync(AppDbContext db, string migrationsDir, ILogger logger)
    {
        if (!Directory.Exists(migrationsDir))
        {
            logger.LogInformation("DbMigrations klasörü yok, atlanıyor: {Dir}", migrationsDir);
            return;
        }

        var providerName = db.Database.ProviderName ?? "";
        var isSqlServer = providerName.Contains("SqlServer", StringComparison.OrdinalIgnoreCase);
        var isSqlite = providerName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase);
        var isPostgres = providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase);

        // Migration history tablosu
        var createTableSql = isSqlServer
            ? $@"IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '{MigrationsTable}')
                 CREATE TABLE [{MigrationsTable}] (
                    [Id] INT IDENTITY(1,1) PRIMARY KEY,
                    [FileName] NVARCHAR(200) NOT NULL UNIQUE,
                    [AppliedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                 );"
            : isPostgres
                ? $@"CREATE TABLE IF NOT EXISTS ""{MigrationsTable}"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""FileName"" VARCHAR(200) NOT NULL UNIQUE,
                    ""AppliedAt"" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                 );"
                : $@"CREATE TABLE IF NOT EXISTS ""{MigrationsTable}"" (
                    ""Id"" INTEGER PRIMARY KEY AUTOINCREMENT,
                    ""FileName"" TEXT NOT NULL UNIQUE,
                    ""AppliedAt"" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                 );";

        try
        {
            await db.Database.ExecuteSqlRawAsync(createTableSql);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Migration tablosu oluşturulamadı");
            throw;
        }

        // Uygulanmış migration'ları al
        var appliedFiles = new HashSet<string>();
        var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = isSqlServer
                ? $"SELECT [FileName] FROM [{MigrationsTable}]"
                : $@"SELECT ""FileName"" FROM ""{MigrationsTable}""";
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                appliedFiles.Add(reader.GetString(0));
            }
        }

        // Dosyaları alfabetik sırayla oku ve uygulanmamışları çalıştır
        var sqlFiles = Directory.GetFiles(migrationsDir, "*.sql")
            .Select(Path.GetFileName)
            .Where(f => f != null && !appliedFiles.Contains(f!))
            .OrderBy(f => f, StringComparer.Ordinal)
            .ToList();

        if (sqlFiles.Count == 0)
        {
            logger.LogInformation("Uygulanacak yeni migration yok.");
            return;
        }

        logger.LogInformation("Uygulanacak migration sayısı: {Count}", sqlFiles.Count);

        foreach (var fileName in sqlFiles)
        {
            if (fileName is null) continue;
            var filePath = Path.Combine(migrationsDir, fileName);
            var sql = await File.ReadAllTextAsync(filePath);

            // Provider filtresi: dosya adı .sqlserver.sql ile bitiyorsa sadece SQL Server'da çalışsın
            if (fileName.EndsWith(".sqlserver.sql", StringComparison.OrdinalIgnoreCase) && !isSqlServer) { MarkApplied(db, fileName, isSqlServer); continue; }
            if (fileName.EndsWith(".sqlite.sql", StringComparison.OrdinalIgnoreCase) && !isSqlite) { MarkApplied(db, fileName, isSqlServer); continue; }
            if (fileName.EndsWith(".postgres.sql", StringComparison.OrdinalIgnoreCase) && !isPostgres) { MarkApplied(db, fileName, isSqlServer); continue; }

            try
            {
                logger.LogInformation("Migration uygulanıyor: {File}", fileName);

                // SQL Server'da GO ile ayrılmış batch'leri destekle
                if (isSqlServer)
                {
                    var batches = sql.Split(new[] { "\nGO\n", "\nGO\r\n", "\r\nGO\r\n", "\r\nGO\n" }, StringSplitOptions.RemoveEmptyEntries);
                    foreach (var batch in batches)
                    {
                        var trimmed = batch.Trim();
                        if (!string.IsNullOrWhiteSpace(trimmed))
                            await db.Database.ExecuteSqlRawAsync(trimmed);
                    }
                }
                else
                {
                    await db.Database.ExecuteSqlRawAsync(sql);
                }

                // Başarılı — tabloya kaydet
                var insertSql = isSqlServer
                    ? $"INSERT INTO [{MigrationsTable}] ([FileName]) VALUES ({{0}})"
                    : $@"INSERT INTO ""{MigrationsTable}"" (""FileName"") VALUES ({{0}})";
                await db.Database.ExecuteSqlRawAsync(insertSql, fileName);

                logger.LogInformation("✓ Migration tamamlandı: {File}", fileName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "✗ Migration başarısız: {File} — {Message}", fileName, ex.Message);
                throw; // Kritik: bir migration başarısız olursa dur
            }
        }
    }

    private static void MarkApplied(AppDbContext db, string fileName, bool isSqlServer)
    {
        var insertSql = isSqlServer
            ? $"INSERT INTO [{MigrationsTable}] ([FileName]) VALUES ({{0}})"
            : $@"INSERT INTO ""{MigrationsTable}"" (""FileName"") VALUES ({{0}})";
        db.Database.ExecuteSqlRaw(insertSql, fileName);
    }
}
