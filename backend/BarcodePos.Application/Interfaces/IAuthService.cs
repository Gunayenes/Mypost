using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Auth;

namespace BarcodePos.Application.Interfaces;

public interface IAuthService
{
    Task<Result<LoginResponse>> LoginAsync(LoginRequest request);
    Task<Result> ChangePasswordAsync(int userId, ChangePasswordRequest request);
}
