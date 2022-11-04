using System.IO;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AppLensV3.Configuration
{
    /// <summary>
    /// Startup class for development environment national cloud. Runtime will use this class when ASPNETCORE_ENVIRONMENT = NationalCloudDevelopment.
    /// </summary>
    public class StartupNationalCloudDevelopment : StartupNationalCloud
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="StartupNationalCloudDevelopment"/> class.
        /// </summary>
        /// <param name="configuration">DI Configuration.</param>
        public StartupNationalCloudDevelopment(IWebHostEnvironment env)
            : base(env)
        {
        }

        public override void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<StartupNationalCloud> logger)
        {
            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] { HeaderConstants.ScriptEtagHeader }));

            app.Use(async (context, next) =>
            {
                await next();
                if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value) && !context.Request.Path.Value.StartsWith("/api/"))
                {
                    context.Request.Path = "/index.html";
                    await next();
                }
            });
            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
