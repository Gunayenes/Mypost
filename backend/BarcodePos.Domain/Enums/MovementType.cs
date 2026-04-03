namespace BarcodePos.Domain.Enums;

/// <summary>
/// Stok hareket türleri.
/// Giris/Cikis/Duzeltme: manuel giriş.
/// Satis/Iade: sistem tarafından otomatik oluşturulur.
/// </summary>
public enum MovementType
{
    Giris = 1,
    Cikis = 2,
    Satis = 3,
    Iade = 4,
    Duzeltme = 5,
    Servis = 6
}
