using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Backup;

namespace BarcodePos.Application.Interfaces;

public interface IBackupService
{
    Task<Result<BackupResultDto>> CreateBackupAsync();
    Task<Result<List<BackupInfoDto>>> GetBackupListAsync();
    Task<Result<RestoreResultDto>> RestoreFromFileAsync(Stream fileStream);
    Task<Result<RestoreResultDto>> RestoreFromExistingAsync(string fileName);
    Task<Result> DeleteBackupAsync(string fileName);
    Task<Result<(Stream FileStream, string FileName)>> GetBackupFileAsync(string fileName);
}
