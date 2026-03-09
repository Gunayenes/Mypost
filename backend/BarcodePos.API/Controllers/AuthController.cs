using System.Security.Claims;
using BarcodePos.Application.DTOs.Auth;
using BarcodePos.Application.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Kullanıcı girişi — JWT token döndürür.
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        [FromServices] IValidator<LoginRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _authService.LoginAsync(request);

        if (!result.Success)
            return Unauthorized(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Şifre değiştirme — oturum açmış kullanıcı kendi şifresini değiştirir.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        [FromServices] IValidator<ChangePasswordRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _authService.ChangePasswordAsync(userId, request);

        if (!result.Success)
            return BadRequest(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }
}
