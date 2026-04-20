using BarcodePos.Domain.Interfaces;

namespace BarcodePos.Infrastructure.Persistence;

/// <summary>
/// Unit of Work implementasyonu. Transaction bütünlüğünü sağlar.
/// AppDbContext üzerinden SaveChanges çağrısını yönetir.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
