namespace BarcodePos.Application.DTOs.Backup;

/// <summary>
/// Yedek dosyası bilgisi — listeleme için kullanılır.
/// </summary>
public class BackupInfoDto
{
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Yedekleme işlemi sonucu.
/// </summary>
public class BackupResultDto
{
    public string FileName { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Geri yükleme işlemi sonucu.
/// </summary>
public class RestoreResultDto
{
    public string Message { get; set; } = string.Empty;
    public string? PreRestoreBackupFileName { get; set; }
}
