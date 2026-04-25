using BarcodePos.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/exchange-rate")]
[Authorize]
public class ExchangeRateController : ControllerBase
{
    private readonly IExchangeRateService _exchangeRateService;

    public ExchangeRateController(IExchangeRateService exchangeRateService)
    {
        _exchangeRateService = exchangeRateService;
    }

    /// <summary>
    /// Güncel USD/TRY döviz kurunu döndürür (15 dk cache).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetRate()
    {
        var rate = await _exchangeRateService.GetUsdTryRateAsync();

        if (rate <= 0)
            return Ok(new { success = false, message = "Döviz kuru alınamadı. Lütfen manuel girin." });

        return Ok(new { success = true, data = new { usdTry = rate } });
    }
}
