using BarcodePos.Domain.Entities;

namespace BarcodePos.API.Extensions;

public static class SubscriptionExtensions
{
    public static SubscriptionPlan? GetSubscriptionPlan(this HttpContext context)
        => context.Items["SubscriptionPlan"] as SubscriptionPlan;
}
