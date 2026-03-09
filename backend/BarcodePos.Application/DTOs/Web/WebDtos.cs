namespace BarcodePos.Application.DTOs.Web;

public class WebRegisterRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class WebLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class WebLoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class WebProfileResponse
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool EmailConfirmed { get; set; }
    public SubscriptionInfo? ActiveSubscription { get; set; }
}

public class SubscriptionInfo
{
    public string PlanName { get; set; } = string.Empty;
    public string PlanSlug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int DaysRemaining { get; set; }
    public int MaxProducts { get; set; }
    public int MaxUsers { get; set; }
    public bool HasReports { get; set; }
    public bool HasBackup { get; set; }
    public bool HasSupport { get; set; }
}
