using System.Security.Claims;
using BarcodePos.Application.DTOs.Web;
using BarcodePos.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/web")]
public class WebAuthController : ControllerBase
{
    private readonly IWebAuthService _webAuthService;

    public WebAuthController(IWebAuthService webAuthService)
    {
        _webAuthService = webAuthService;
    }

    /// <summary>
    /// Yeni müşteri kaydı — otomatik 14 gün demo abonelik oluşturur.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Register(
        [FromBody] WebRegisterRequest request,
        [FromServices] IValidator<WebRegisterRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _webAuthService.RegisterAsync(request);

        if (!result.Success)
            return Conflict(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Web müşteri girişi — JWT token döndürür.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(
        [FromBody] WebLoginRequest request,
        [FromServices] IValidator<WebLoginRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _webAuthService.LoginAsync(request);

        if (!result.Success)
            return Unauthorized(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Şifre sıfırlama talebi — e-posta ile token gönderir.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        [FromServices] IValidator<ForgotPasswordRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _webAuthService.ForgotPasswordAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Şifre sıfırlama — token ile yeni şifre belirler.
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(
        [FromBody] ResetPasswordRequest request,
        [FromServices] IValidator<ResetPasswordRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _webAuthService.ResetPasswordAsync(request);

        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Giriş yapmış müşterinin profil ve abonelik bilgilerini döndürür.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "WebCustomer")]
    public async Task<IActionResult> GetProfile()
    {
        var customerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _webAuthService.GetProfileAsync(customerId);

        if (!result.Success)
            return NotFound(new { success = false, message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// E-posta doğrulama — token ile e-posta adresini onaylar.
    /// </summary>
    [HttpGet("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { success = false, message = "Token zorunlu." });

        var result = await _webAuthService.ConfirmEmailAsync(token);

        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message });

        return Ok(result);
    }

    /// <summary>
    /// Doğrulama e-postasını tekrar gönderir.
    /// </summary>
    [HttpPost("resend-confirmation")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ForgotPasswordRequest request)
    {
        var result = await _webAuthService.ResendConfirmationAsync(request.Email);
        return Ok(result);
    }
}
