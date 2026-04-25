using System.Text.Json;
using BarcodePos.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace BarcodePos.Infrastructure.Services;

public class ExchangeRateService : IExchangeRateService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExchangeRateService> _logger;

    private static decimal _cachedRate;
    private static DateTime _lastFetch = DateTime.MinValue;
    private static readonly TimeSpan CacheInterval = TimeSpan.FromMinutes(15);
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public ExchangeRateService(IHttpClientFactory httpClientFactory, ILogger<ExchangeRateService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<decimal> GetUsdTryRateAsync()
    {
        if (DateTime.UtcNow - _lastFetch < CacheInterval && _cachedRate > 0)
            return _cachedRate;

        await _lock.WaitAsync();
        try
        {
            if (DateTime.UtcNow - _lastFetch < CacheInterval && _cachedRate > 0)
                return _cachedRate;

            var rate = await FetchFromPrimaryAsync() ?? await FetchFromFallbackAsync();
            if (rate is > 0)
            {
                _cachedRate = rate.Value;
                _lastFetch = DateTime.UtcNow;
            }
            return _cachedRate;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<decimal> RefreshAsync()
    {
        _lastFetch = DateTime.MinValue;
        return await GetUsdTryRateAsync();
    }

    private async Task<decimal?> FetchFromPrimaryAsync()
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);
            var response = await client.GetStringAsync("https://open.er-api.com/v6/latest/USD");
            using var doc = JsonDocument.Parse(response);

            if (doc.RootElement.GetProperty("result").GetString() == "success"
                && doc.RootElement.GetProperty("rates").TryGetProperty("TRY", out var tryRate))
            {
                return tryRate.GetDecimal();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary döviz API başarısız");
        }
        return null;
    }

    private async Task<decimal?> FetchFromFallbackAsync()
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);
            var response = await client.GetStringAsync("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
            using var doc = JsonDocument.Parse(response);

            if (doc.RootElement.TryGetProperty("usd", out var rates)
                && rates.TryGetProperty("try", out var tryRate))
            {
                return tryRate.GetDecimal();
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Fallback döviz API başarısız");
        }
        return null;
    }
}
