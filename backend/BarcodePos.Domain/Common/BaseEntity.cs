namespace BarcodePos.Domain.Common;

/// <summary>
/// Tüm entity'lerin temel sınıfı. Id ve oluşturulma tarihi içerir.
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
