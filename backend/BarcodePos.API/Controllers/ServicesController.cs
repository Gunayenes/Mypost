using BarcodePos.Application.DTOs.Services;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServicesController : ControllerBase
{
    private readonly IServiceRecordService _serviceService;
    private readonly ICurrentUser _currentUser;

    public ServicesController(IServiceRecordService serviceService, ICurrentUser currentUser)
    {
        _serviceService = serviceService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Servis kayıtları listesi — sayfalı ve filtrelenebilir.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] ServiceListFilter filter)
    {
        var result = await _serviceService.GetAllAsync(filter, _currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Servis özet istatistikleri.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _serviceService.GetSummaryAsync(_currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Servis kaydı detayı.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _serviceService.GetByIdAsync(id, _currentUser.StoreId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Yeni servis kaydı oluştur.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateServiceRequest request,
        [FromServices] IValidator<CreateServiceRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.CreateAsync(request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return Conflict(new { success = false, message = result.Message });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Servis kaydı güncelle.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateServiceRequest request,
        [FromServices] IValidator<UpdateServiceRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.UpdateAsync(id, request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return result.Message!.Contains("bulunamadı") ? NotFound(new { success = false, message = result.Message }) : Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servis durumu güncelle.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] UpdateServiceStatusRequest request,
        [FromServices] IValidator<UpdateServiceStatusRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.UpdateStatusAsync(id, request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return result.Message!.Contains("bulunamadı") ? NotFound(new { success = false, message = result.Message }) : Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servis önceliği güncelle.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPatch("{id:int}/priority")]
    public async Task<IActionResult> UpdatePriority(
        int id,
        [FromBody] UpdateServicePriorityRequest request,
        [FromServices] IValidator<UpdateServicePriorityRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.UpdatePriorityAsync(id, request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return result.Message!.Contains("bulunamadı") ? NotFound(new { success = false, message = result.Message }) : Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servise parça ekle. Stok ürünü ise stoktan düşer.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("{id:int}/parts")]
    public async Task<IActionResult> AddPart(
        int id,
        [FromBody] AddServicePartRequest request,
        [FromServices] IValidator<AddServicePartRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.AddPartAsync(id, request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servisten parça sil. Stoktan düşülmüşse geri eklenir.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpDelete("{id:int}/parts/{partId:int}")]
    public async Task<IActionResult> RemovePart(int id, int partId)
    {
        var result = await _serviceService.RemovePartAsync(id, partId, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servise ödeme ekle.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("{id:int}/payments")]
    public async Task<IActionResult> AddPayment(
        int id,
        [FromBody] AddServicePaymentRequest request,
        [FromServices] IValidator<AddServicePaymentRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.AddPaymentAsync(id, request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servise not/log ekle.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpPost("{id:int}/logs")]
    public async Task<IActionResult> AddLog(
        int id,
        [FromBody] AddServiceLogRequest request,
        [FromServices] IValidator<AddServiceLogRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new { success = false, message = "Doğrulama hatası.", errors = validation.Errors.Select(e => e.ErrorMessage) });

        var result = await _serviceService.AddLogAsync(id, request, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return Conflict(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Servis kaydını sil.
    /// </summary>
    [Authorize(Roles = "Admin,Yonetici")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _serviceService.DeleteAsync(id, _currentUser.StoreId, _currentUser.UserId);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    // ── Müşteri Dış Takip (Authentication gerektirmez) ──

    /// <summary>
    /// Servis numarası ile servis takibi — müşteri dış sorgusu.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    [HttpGet("track/{serviceNumber}")]
    public async Task<IActionResult> TrackByNumber(string serviceNumber)
    {
        var result = await _serviceService.TrackByNumberAsync(serviceNumber);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }

    /// <summary>
    /// Telefon numarası ile servis takibi — müşteri dış sorgusu.
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting("public")]
    [HttpGet("track/phone/{phone}")]
    public async Task<IActionResult> TrackByPhone(string phone)
    {
        var result = await _serviceService.TrackByPhoneAsync(phone);
        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });
        return Ok(result);
    }
}
