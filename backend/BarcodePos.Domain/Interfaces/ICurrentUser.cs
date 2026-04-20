namespace BarcodePos.Domain.Interfaces;

/// <summary>
/// Oturum açmış kullanıcı bilgilerini sağlayan arayüz.
/// HttpContext claim'lerinden okunur.
/// </summary>
public interface ICurrentUser
{
    int UserId { get; }
    string Username { get; }
    string Role { get; }
    int StoreId { get; }
    bool IsAdmin { get; }
    bool IsManagerOrAbove { get; }
}
