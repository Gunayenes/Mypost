using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/exchange-rate")]
[Authorize]
public class ExchangeRateController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ExchangeRateController> _logger;

    // Cache — her 15 dakikada bir güncelle
    private static decimal _cachedRate;
    private static DateTime _lastFetch = DateTime.MinValue;
    private static readonly TimeSpan CacheInterval = TimeSpan.FromMinutes(15);
    private static readonly SemaphoreSlim _lock = new(1, 1);

    public ExchangeRateController(IHttpClientFactory httpClientFactory, ILogger<ExchangeRateController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Güncel USD/TRY döviz kurunu döndürür (15 dk cache).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRate()
    {
        var rate = await GetCachedRateAsync();

        if (rate <= 0)
            return Ok(new { success = false, message = "Döviz kuru alınamadı. Lütfen manuel girin." });

        return Ok(new { success = true, data = new { usdTry = rate, updatedAt = _lastFetch } });
    }

    private async Task<decimal> GetCachedRateAsync()
    {
        if (DateTime.UtcNow - _lastFetch < CacheInterval && _cachedRate > 0)
            return _cachedRate;

        await _lock.WaitAsync();
        try
        {
            // Double-check after lock
            if (DateTime.UtcNow - _lastFetch < CacheInterval && _cachedRate > 0)
                return _cachedRate;

            var rate = await FetchFromPrimaryAsync() ?? await FetchFromFallbackAsync();

            if (rate is > 0)
            {
                _cachedRate = rate.Value;
                _lastFetch = DateTime.UtcNow;
                _logger.LogInformation("Döviz kuru güncellendi: 1 USD = {Rate} TRY", rate);
            }

            return _cachedRate;
        }
        finally
        {
            _lock.Release();
        }
    }

    /// <summary>
    /// Primary: open.er-api.com (ücretsiz, API key gerektirmez)
    /// </summary>
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

    /// <summary>
    /// Fallback: cdn.jsdelivr.net (GitHub üzerinden, ücretsiz)
    /// </summary>
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
