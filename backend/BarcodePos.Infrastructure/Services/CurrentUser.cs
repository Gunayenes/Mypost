using System.Security.Claims;
using BarcodePos.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace BarcodePos.Infrastructure.Services;

/// <summary>
/// HttpContext claim'lerinden oturum açmış kullanıcı bilgilerini okur.
/// </summary>
public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public int UserId => int.TryParse(
        User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;

    public string Username => User?.FindFirstValue(ClaimTypes.Name) ?? string.Empty;

    public string Role => User?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    public int StoreId => int.TryParse(
        User?.FindFirstValue("StoreId"), out var id) ? id : 0;

    public bool IsAdmin => Role == "Admin";

    public bool IsManagerOrAbove => Role is "Admin" or "Yonetici";
}
