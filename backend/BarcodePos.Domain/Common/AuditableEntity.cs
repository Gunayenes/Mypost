namespace BarcodePos.Domain.Common;

/// <summary>
/// Güncelleme tarihi takibi gereken entity'ler için temel sınıf.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public DateTime? UpdatedAt { get; set; }
}
