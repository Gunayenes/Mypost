namespace BarcodePos.Domain.Enums;

/// <summary>
/// Servis kaydı durum aşamaları.
/// </summary>
public enum ServiceStatus
{
    KayitAcildi = 1,
    Incelemede = 2,
    OnayBekliyor = 3,
    ParcaBekliyor = 4,
    Islemde = 5,
    Tamamlandi = 6,
    TeslimEdildi = 7,
    IptalEdildi = 8
}
