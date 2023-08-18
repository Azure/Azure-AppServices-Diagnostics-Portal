using System;
using System.IO;
using AppLensV3.Helpers;
using AppLensV3.Hubs;
using AppLensV3.Middleware;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace AppLensV3
{
    public sealed class StartupPublicAzure: IStartup
    {
        private IConfiguration _configuration;
        public void AddCloudSpecificServices(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
        {
            services.AddBearerAuthFlow(configuration, environment);
            _configuration = configuration;
        }

        public void AddConfigurations(ConfigurationBuilder builder, IWebHostEnvironment env, string cloudDomaintempConfig)
        {
            builder.SetBasePath(env.ContentRootPath)
                    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
            if (env.IsDevelopment() && !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("KeyVault")))
            {
                string keyvault = Environment.GetEnvironmentVariable("KeyVault");
                var secretClient = new SecretClient(
                                       new Uri(keyvault),
                                                          new DefaultAzureCredential());
                builder.AddAzureKeyVault(secretClient, new KeyVaultSecretManager());
            }

            builder.AddJsonFile($"appsettings.PublicAzure.json", optional: false, reloadOnChange: true)
                    .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                    .AddEnvironmentVariables();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseCors("CorsPolicy");
            }
            else
            {
                app.UseCors(cors =>
                    cors
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowAnyOrigin()
                    .WithExposedHeaders(new string[] { HeaderConstants.ScriptEtagHeader }));
            }

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();
            app.UseMiddleware<RequestMiddleware>();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                if (_configuration.GetValue("OpenAIService:Enabled", false))
                {
                    endpoints.MapHub<OpenAIChatCompletionHub>("/chatcompletionHub");
                }
            });

            app.Use(async (context, next) =>
            {
                await next();
                if (context.Response.StatusCode == 404 &&
                    !Path.HasExtension(context.Request.Path.Value) &&
                    !context.Request.Path.Value.StartsWith("/api/"))
                {
                    context.Request.Path = "/index.html";
                    await next();
                }
            });

            app.UseDefaultFiles();
            app.UseStaticFiles();
        }
    }
}
