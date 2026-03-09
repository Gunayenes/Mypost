using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace BarcodePos.Infrastructure.Services;

/// <summary>
/// Donanım tabanlı lisans sistemi.
/// Makine ID'sine göre lisans anahtarı üretir ve doğrular.
/// </summary>
public static class LicenseService
{
    // ── Bu anahtar sadece sende olacak — kimseyle paylaşma! ──
    private const string SECRET_KEY = "BarcodePos-License-Secret-2025-DONOT-SHARE!!";
    private const string LICENSE_FILE = "license.key";

    /// <summary>
    /// Bu PC'nin benzersiz Makine ID'sini üretir.
    /// </summary>
    public static string GetMachineId()
    {
        var raw = $"{Environment.MachineName}-{Environment.UserName}-{RuntimeInformation.OSDescription}-{Environment.ProcessorCount}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        // İlk 16 byte → 8 haneli hex gruplar
        return BitConverter.ToString(hash, 0, 16).Replace("-", "").ToUpper();
    }

    /// <summary>
    /// Makine ID'sine göre lisans anahtarı üretir.
    /// BU METOD SADECE SENİN (GELİŞTİRİCİ) KULLANIMIN İÇİN.
    /// </summary>
    public static string GenerateLicenseKey(string machineId, string customerName, DateTime expiresAt, string username, string password)
    {
        var payload = new LicensePayload
        {
            MachineId = machineId,
            CustomerName = customerName,
            ExpiresAt = expiresAt,
            IssuedAt = DateTime.UtcNow,
            Username = username,
            Password = password,
        };

        var json = JsonSerializer.Serialize(payload);
        var jsonBytes = Encoding.UTF8.GetBytes(json);
        var base64 = Convert.ToBase64String(jsonBytes);

        // HMAC imza oluştur
        var signature = ComputeSignature(base64);

        return $"{base64}.{signature}";
    }

    /// <summary>
    /// Lisans anahtarını doğrular.
    /// </summary>
    public static LicenseResult ValidateLicense(string? licenseKey, string currentMachineId)
    {
        if (string.IsNullOrWhiteSpace(licenseKey))
            return LicenseResult.Fail("Lisans anahtarı bulunamadı.");

        var parts = licenseKey.Split('.');
        if (parts.Length != 2)
            return LicenseResult.Fail("Geçersiz lisans formatı.");

        var base64 = parts[0];
        var signature = parts[1];

        // İmza doğrula
        var expectedSignature = ComputeSignature(base64);
        if (signature != expectedSignature)
            return LicenseResult.Fail("Lisans anahtarı geçersiz.");

        // Payload çöz
        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(base64));
            var payload = JsonSerializer.Deserialize<LicensePayload>(json);

            if (payload == null)
                return LicenseResult.Fail("Lisans verisi okunamadı.");

            // Makine ID kontrolü
            if (!string.Equals(payload.MachineId, currentMachineId, StringComparison.OrdinalIgnoreCase))
                return LicenseResult.Fail("Bu lisans bu bilgisayar için geçerli değil.");

            // Süre kontrolü
            if (payload.ExpiresAt < DateTime.UtcNow)
                return LicenseResult.Fail($"Lisans süresi dolmuş. ({payload.ExpiresAt:dd.MM.yyyy})");

            return LicenseResult.Ok(payload.CustomerName, payload.ExpiresAt, payload.Username, payload.Password);
        }
        catch
        {
            return LicenseResult.Fail("Lisans verisi bozuk.");
        }
    }

    /// <summary>
    /// Lisans dosyasını okur.
    /// </summary>
    public static string? ReadLicenseFile(string baseDir)
    {
        var path = Path.Combine(baseDir, LICENSE_FILE);
        return File.Exists(path) ? File.ReadAllText(path).Trim() : null;
    }

    /// <summary>
    /// Lisans anahtarını dosyaya yazar.
    /// </summary>
    public static void SaveLicenseFile(string baseDir, string licenseKey)
    {
        var path = Path.Combine(baseDir, LICENSE_FILE);
        File.WriteAllText(path, licenseKey);
    }

    private static string ComputeSignature(string data)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SECRET_KEY));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return Convert.ToBase64String(hash);
    }
}

public class LicensePayload
{
    public string MachineId { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime IssuedAt { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LicenseResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public string? CustomerName { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public string? Username { get; set; }
    public string? Password { get; set; }

    public static LicenseResult Ok(string customerName, DateTime expiresAt, string username, string password) =>
        new() { IsValid = true, CustomerName = customerName, ExpiresAt = expiresAt, Username = username, Password = password };

    public static LicenseResult Fail(string message) =>
        new() { IsValid = false, ErrorMessage = message };
}
