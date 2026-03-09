using FluentValidation;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.DependencyInjection;

namespace BarcodePos.Application;

/// <summary>
/// Application katmanı servis kayıtları.
/// Program.cs'de builder.Services.AddApplication() olarak çağrılır.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // FluentValidation — Application katmanındaki tüm validator'ları otomatik kaydet
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        // Mapster — mapping konfigürasyonu
        var config = TypeAdapterConfig.GlobalSettings;
        config.Scan(typeof(DependencyInjection).Assembly);
        services.AddSingleton(config);
        services.AddScoped<IMapper, ServiceMapper>();

        return services;
    }
}
