using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Web;

namespace BarcodePos.Application.Interfaces;

public interface IWebAuthService
{
    Task<Result<WebLoginResponse>> RegisterAsync(WebRegisterRequest request);
    Task<Result<WebLoginResponse>> LoginAsync(WebLoginRequest request);
    Task<Result> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<Result> ResetPasswordAsync(ResetPasswordRequest request);
    Task<Result<WebProfileResponse>> GetProfileAsync(int customerId);
    Task<Result> ConfirmEmailAsync(string token);
    Task<Result> ResendConfirmationAsync(string email);
}
