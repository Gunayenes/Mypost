namespace BarcodePos.Domain.Interfaces;

/// <summary>
/// Genel repository arayüzü — tüm entity'ler için ortak CRUD operasyonları.
/// </summary>
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
    Task<int> CountAsync(CancellationToken cancellationToken = default);
    IQueryable<T> Query();
}
