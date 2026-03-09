namespace BarcodePos.Application.DTOs.Web;

// ── Site Admin Login ──
public class SiteAdminLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class SiteAdminLoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

// ── Dashboard ──
public class SiteAdminDashboardResponse
{
    public int TotalCustomers { get; set; }
    public int ActiveCustomers { get; set; }
    public int TotalSubscriptions { get; set; }
    public int ActiveSubscriptions { get; set; }
    public int ExpiringIn7Days { get; set; }
    public int TotalStores { get; set; }
    public List<RecentCustomerItem> RecentCustomers { get; set; } = [];
}

public class RecentCustomerItem
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// ── Customer List ──
public class SiteAdminCustomerListItem
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? ActivePlan { get; set; }
    public DateTime? SubscriptionExpiry { get; set; }
}

// ── Customer Detail ──
public class SiteAdminCustomerDetail
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public int StoreId { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SiteAdminSubscriptionItem> Subscriptions { get; set; } = [];
}

// ── Subscription List ──
public class SiteAdminSubscriptionItem
{
    public int Id { get; set; }
    public int WebCustomerId { get; set; }
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string PlanSlug { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public int DaysRemaining { get; set; }
}

// ── Subscription Actions ──
public class ExtendSubscriptionRequest
{
    public int Days { get; set; }
}

public class ChangePlanRequest
{
    public int PlanId { get; set; }
}

// ── License Management ──
public class LicenseListItem
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string MachineId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string LicenseKey { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; } = string.Empty;
    public int DaysLeft { get; set; }
}

public class LicenseStatsResponse
{
    public int Total { get; set; }
    public int Active { get; set; }
    public int ExpiringSoon { get; set; }
    public int Expired { get; set; }
    public int Inactive { get; set; }
}

public class CreateLicenseRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string MachineId { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Note { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int DurationDays { get; set; } = 365;
}

public class RenewLicenseRequest
{
    public int DurationDays { get; set; } = 365;
    public string? Password { get; set; }
}
