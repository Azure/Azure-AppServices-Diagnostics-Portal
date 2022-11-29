using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using System;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class AppServiceDiagnosticsServiceCollectionServiceExtensions
    {
        public static IServiceCollection AddSingletonWhenEnabled<TService, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] TImplementation>(this IServiceCollection services, IConfiguration configuration, string serviceName, string propertyName = "Enabled")
            where TService : class
            where TImplementation : class, TService
        {
            if (services == null)
            {
                throw new ArgumentNullException(nameof(services));
            }

            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }

            if (propertyName == null)
            {
                throw new ArgumentNullException(nameof(propertyName));
            }

            if (configuration.GetValue($"{serviceName}:{propertyName}", false))
            {
                return services.AddSingleton(typeof(TService), typeof(TImplementation));
            }

            return services;
        }

        public static IServiceCollection AddSingletonWhenEnabled<TService, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] TImplementation1, [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] TImplementation2>(this IServiceCollection services, IConfiguration configuration, string serviceName, string propertyName = "Enabled")
            where TService : class
            where TImplementation1 : class, TService
            where TImplementation2 : class, TService
        {
            if (services == null)
            {
                throw new ArgumentNullException(nameof(services));
            }

            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }

            if (propertyName == null)
            {
                throw new ArgumentNullException(nameof(propertyName));
            }

            if (configuration.GetValue($"{serviceName}:{propertyName}", false))
            {
                return services.AddSingleton(typeof(TService), typeof(TImplementation1));
            }
            else
            {
                return services.AddSingleton(typeof(TService), typeof(TImplementation2));
            }
        }
    }
}
