namespace BarcodePos.Domain.Enums;

/// <summary>
/// Ödeme türleri — satış işleminde kullanılır.
/// </summary>
public enum PaymentType
{
    Nakit = 1,
    Kart = 2,
    Veresiye = 3,
    Parcali = 4,
    /// <summary>İade işlemi — müşteriye geri ödeme yapılır; ürünler stoğa geri eklenir.</summary>
    Iade = 5
}
