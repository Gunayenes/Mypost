namespace BarcodePos.Domain.Interfaces;

/// <summary>
/// Unit of Work arayüzü — transaction bütünlüğünü sağlar.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
