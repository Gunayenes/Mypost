namespace BarcodePos.Application.Interfaces;

public interface IExchangeRateService
{
    /// <summary>
    /// Güncel USD/TRY kuru (15 dk cache).
    /// </summary>
    Task<decimal> GetUsdTryRateAsync();

    /// <summary>
    /// Cache'i zorla yenile.
    /// </summary>
    Task<decimal> RefreshAsync();
}
