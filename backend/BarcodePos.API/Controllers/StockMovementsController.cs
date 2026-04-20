using BarcodePos.Application.DTOs.StockMovements;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/stock-movements")]
[Authorize(Roles = "Admin,Yonetici")]
public class StockMovementsController : ControllerBase
{
    private readonly IStockMovementService _stockMovementService;
    private readonly ICurrentUser _currentUser;

    public StockMovementsController(IStockMovementService stockMovementService, ICurrentUser currentUser)
    {
        _stockMovementService = stockMovementService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Stok hareketleri listesi — filtrelenebilir, sayfalı.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] StockMovementFilter filter)
    {
        var result = await _stockMovementService.GetAllAsync(filter, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Belirli ürünün stok hareketleri.
    /// </summary>
    [HttpGet("product/{productId:int}")]
    public async Task<IActionResult> GetByProduct(int productId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _stockMovementService.GetByProductAsync(productId, _currentUser.StoreId, page, pageSize);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Manuel stok hareketi oluştur (Giriş / Çıkış / Düzeltme).
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateStockMovementRequest request,
        [FromServices] IValidator<CreateStockMovementRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _stockMovementService.CreateManualAsync(request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }
}
