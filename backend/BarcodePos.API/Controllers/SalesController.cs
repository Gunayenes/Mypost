using BarcodePos.Application.DTOs.Sales;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService _saleService;
    private readonly ICurrentUser _currentUser;

    public SalesController(ISaleService saleService, ICurrentUser currentUser)
    {
        _saleService = saleService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Yeni satış oluştur — POS ana işlemi. Kasiyer+
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateSaleRequest request,
        [FromServices] IValidator<CreateSaleRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _saleService.CreateAsync(request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Satış detayı. Kasiyer+
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _saleService.GetByIdAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Satış listesi — filtrelenebilir, sayfalı. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] SaleListFilter filter)
    {
        var result = await _saleService.GetAllAsync(filter, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Fiş numarası ile satış sorgulama. Kasiyer+
    /// </summary>
    [HttpGet("receipt/{receiptNumber}")]
    public async Task<IActionResult> GetByReceiptNumber(string receiptNumber)
    {
        var result = await _saleService.GetByReceiptNumberAsync(receiptNumber, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Satış iptal. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var result = await _saleService.CancelAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Satış iade — stok geri yüklenir. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("{id:int}/return")]
    public async Task<IActionResult> Return(int id)
    {
        var result = await _saleService.ReturnAsync(id, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }
}
