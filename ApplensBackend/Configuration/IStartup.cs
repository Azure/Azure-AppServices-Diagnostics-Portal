using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AppLensV3
{
    public interface IStartup
    {
        void AddCloudSpecificServices(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment);
        void Configure(IApplicationBuilder app, IWebHostEnvironment env);
    }
}
