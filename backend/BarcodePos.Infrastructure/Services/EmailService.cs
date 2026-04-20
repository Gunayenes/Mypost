using System.Net;
using System.Net.Mail;
using BarcodePos.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BarcodePos.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly string? _smtpHost;
    private readonly int _smtpPort;
    private readonly string? _smtpUser;
    private readonly string? _smtpPass;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly string _baseUrl;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;

        _smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? _config["Smtp:Host"];
        _smtpPort = int.TryParse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? _config["Smtp:Port"], out var p) ? p : 587;
        _smtpUser = Environment.GetEnvironmentVariable("SMTP_USER") ?? _config["Smtp:User"];
        _smtpPass = Environment.GetEnvironmentVariable("SMTP_PASS") ?? _config["Smtp:Pass"];
        _fromEmail = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? _config["Smtp:FromEmail"] ?? "noreply@cari-soft.com";
        _fromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? _config["Smtp:FromName"] ?? "Cari Soft";
        _baseUrl = Environment.GetEnvironmentVariable("APP_BASE_URL") ?? _config["AppBaseUrl"] ?? "http://localhost:5173";
    }

    private bool IsConfigured => !string.IsNullOrEmpty(_smtpHost) && !string.IsNullOrEmpty(_smtpUser);

    public async Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmToken)
    {
        var confirmUrl = $"{_baseUrl}/email-dogrula?token={confirmToken}";

        var subject = "Cari Soft — E-posta Adresinizi Doğrulayın";
        var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #1a1a2e; margin: 0;">Cari Soft</h2>
                    <p style="color: #888; font-size: 14px;">Akıllı Satış Noktası</p>
                </div>
                <p style="font-size: 16px; color: #333;">Merhaba <strong>{fullName}</strong>,</p>
                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                    Cari Soft'a kayıt olduğunuz için teşekkür ederiz. Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{confirmUrl}" style="display: inline-block; padding: 12px 32px; background-color: #6c63ff; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
                        E-postamı Doğrula
                    </a>
                </div>
                <p style="font-size: 12px; color: #999; line-height: 1.5;">
                    Bu bağlantı 48 saat geçerlidir. Eğer bu kaydı siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 11px; color: #bbb; text-align: center;">© Cari Soft — Akıllı Satış Noktası</p>
            </div>
            """;

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendPasswordResetAsync(string toEmail, string fullName, string resetToken)
    {
        var resetUrl = $"{_baseUrl}/sifre-sifirla?token={resetToken}";

        var subject = "Cari Soft — Şifre Sıfırlama Talebi";
        var body = $"""
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #1a1a2e; margin: 0;">Cari Soft</h2>
                    <p style="color: #888; font-size: 14px;">Akıllı Satış Noktası</p>
                </div>
                <p style="font-size: 16px; color: #333;">Merhaba <strong>{fullName}</strong>,</p>
                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                    Hesabınız için bir şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="{resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #f59e0b; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
                        Şifremi Sıfırla
                    </a>
                </div>
                <p style="font-size: 12px; color: #999; line-height: 1.5;">
                    Bu bağlantı 1 saat geçerlidir. Eğer bu talebi siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz, hesabınız güvende.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 11px; color: #bbb; text-align: center;">© Cari Soft — Akıllı Satış Noktası</p>
            </div>
            """;

        await SendAsync(toEmail, subject, body);
    }

    private async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (!IsConfigured)
        {
            _logger.LogWarning("SMTP yapılandırılmamış, e-posta gönderilemiyor: {To} — {Subject}", toEmail, subject);
            return;
        }

        try
        {
            using var client = new SmtpClient(_smtpHost!, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUser, _smtpPass),
                EnableSsl = true
            };

            var message = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
            _logger.LogInformation("E-posta gönderildi: {To} — {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "E-posta gönderilemedi: {To} — {Subject}", toEmail, subject);
            // E-posta hatası kullanıcıyı engellemez — sessizce logla
        }
    }
}
