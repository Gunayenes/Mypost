using BarcodePos.API.Extensions;
using BarcodePos.Application.DTOs.Users;
using BarcodePos.Application.Interfaces;
using BarcodePos.Domain.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarcodePos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUser _currentUser;

    public UsersController(IUserService userService, ICurrentUser currentUser)
    {
        _userService = userService;
        _currentUser = currentUser;
    }

    /// <summary>
    /// Mağazadaki tüm kullanıcıları listeler.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _userService.GetAllAsync(_currentUser.StoreId);
        return Ok(result);
    }

    /// <summary>
    /// Belirtilen ID'ye sahip kullanıcıyı getirir.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _userService.GetByIdAsync(id, _currentUser.StoreId);

        if (!result.Success)
            return NotFound(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Yeni kullanıcı oluşturur.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserRequest request,
        [FromServices] IValidator<CreateUserRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        // Plan limit kontrolü
        var plan = HttpContext.GetSubscriptionPlan();
        if (plan is not null)
        {
            var users = await _userService.GetAllAsync(_currentUser.StoreId);
            if (users.Success && users.Data!.Count >= plan.MaxUsers)
                return BadRequest(new { success = false, message = $"Mevcut planınızda en fazla {plan.MaxUsers} kullanıcı ekleyebilirsiniz. Lütfen paketinizi yükseltin." });
        }

        var result = await _userService.CreateAsync(request, _currentUser.StoreId);

        if (!result.Success)
            return Conflict(new { success = false, message = result.Message, errors = result.Errors });

        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    /// <summary>
    /// Kullanıcı bilgilerini günceller.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateUserRequest request,
        [FromServices] IValidator<UpdateUserRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _userService.UpdateAsync(id, request, _currentUser.StoreId);

        if (!result.Success)
            return NotFound(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Kullanıcı rolünü değiştirir.
    /// </summary>
    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(
        int id,
        [FromBody] ChangeRoleRequest request,
        [FromServices] IValidator<ChangeRoleRequest> validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(new
            {
                success = false,
                message = "Doğrulama hatası.",
                errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
            });

        var result = await _userService.ChangeRoleAsync(id, request, _currentUser.StoreId);

        if (!result.Success)
            return NotFound(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }

    /// <summary>
    /// Kullanıcı durumunu aktif/pasif yapar.
    /// </summary>
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var result = await _userService.ToggleStatusAsync(id, _currentUser.StoreId);

        if (!result.Success)
            return NotFound(new { success = false, message = result.Message, errors = result.Errors });

        return Ok(result);
    }
}
