using BarcodePos.Domain.Common;

namespace BarcodePos.Domain.Entities;

/// <summary>
/// Ziyaretçilerin iletişim formundan gönderdiği mesajlar.
/// Site admin panelde listelenip yanıtlanır.
/// </summary>
public class ContactMessage : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? BusinessName { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
