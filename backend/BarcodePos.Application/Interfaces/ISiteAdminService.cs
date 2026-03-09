using BarcodePos.Application.Common;
using BarcodePos.Application.DTOs.Web;

namespace BarcodePos.Application.Interfaces;

public interface ISiteAdminService
{
    Task<Result<SiteAdminLoginResponse>> LoginAsync(SiteAdminLoginRequest request);
    Task<Result<SiteAdminDashboardResponse>> GetDashboardAsync();
    Task<Result<PagedResult<SiteAdminCustomerListItem>>> GetCustomersAsync(string? search, int page, int pageSize);
    Task<Result<SiteAdminCustomerDetail>> GetCustomerDetailAsync(int customerId);
    Task<Result> ToggleCustomerActiveAsync(int customerId);
    Task<Result<PagedResult<SiteAdminSubscriptionItem>>> GetSubscriptionsAsync(string? filter, int page, int pageSize);
    Task<Result> ExtendSubscriptionAsync(int subscriptionId, int days);
    Task<Result> CancelSubscriptionAsync(int subscriptionId);
}
