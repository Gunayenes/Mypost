using BarcodePos.Application.DTOs.Customers;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ICurrentUser _currentUser;

    public CustomersController(ICustomerService customerService, ICurrentUser currentUser)
    {
        _customerService = customerService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Müşteri listesi — sayfalı. Kasiyer+
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] CustomerListFilter filter)
    {
        var result = await _customerService.GetAllAsync(filter, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Müşteri detayı. Kasiyer+
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _customerService.GetByIdAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Yeni müşteri oluştur. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCustomerRequest request,
        [FromServices] IValidator<CreateCustomerRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _customerService.CreateAsync(request, _currentUser.StoreId);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Müşteri güncelle. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateCustomerRequest request,
        [FromServices] IValidator<UpdateCustomerRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _customerService.UpdateAsync(id, request, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Müşteri bakiye özeti. Kasiyer+
    /// </summary>
    [HttpGet("{id:int}/balance")]
    public async Task<IActionResult> GetBalance(int id)
    {
        var result = await _customerService.GetBalanceAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Müşteri işlem geçmişi — sayfalı. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("{id:int}/transactions")]
    public async Task<IActionResult> GetTransactions(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _customerService.GetTransactionsAsync(id, _currentUser.StoreId, page, pageSize);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// POS müşteri arama — isim veya telefon. Kasiyer+
    /// </summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        var result = await _customerService.SearchAsync(q, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Veresiye tahsilat. Yonetici+
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("{id:int}/payment")]
    public async Task<IActionResult> CollectPayment(
        int id,
        [FromBody] CustomerPaymentRequest request,
        [FromServices] IValidator<CustomerPaymentRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _customerService.CollectPaymentAsync(id, request, _currentUser.StoreId);
        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });
        return Ok(result);
    }
}
