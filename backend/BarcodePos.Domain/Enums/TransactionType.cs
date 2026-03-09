namespace BarcodePos.Domain.Enums;

/// <summary>
/// Müşteri hesap hareket türleri.
/// Borc: veresiye satıştan gelen borç.
/// Odeme: müşterinin yaptığı tahsilat.
/// </summary>
public enum TransactionType
{
    Borc = 1,
    Odeme = 2
}
