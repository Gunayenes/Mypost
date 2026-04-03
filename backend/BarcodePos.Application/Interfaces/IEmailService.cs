namespace BarcodePos.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmToken);
    Task SendPasswordResetAsync(string toEmail, string fullName, string resetToken);
}
