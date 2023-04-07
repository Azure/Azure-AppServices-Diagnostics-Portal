using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Backend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Backend.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.ApplicationInsights.AspNetCore.Extensions;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Mvc;

namespace Backend
{
    public class Startup
    {
        public Startup(IWebHostEnvironment env)
        {

            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            if (env.IsDevelopment())
            {
                builder.AddApplicationInsightsSettings(developerMode: true);
            }

            Configuration = builder.Build();
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {

            var applicationInsightsOptions = new ApplicationInsightsServiceOptions
            {
                InstrumentationKey = Configuration["ApplicationInsights:InstrumentationKey"],
                EnableAdaptiveSampling = false
            };
            services.AddApplicationInsightsTelemetry(applicationInsightsOptions);
            services.AddSingleton<ITelemetryInitializer, AppInsightsTelemetryInitializer>();

            services.AddMvc(options =>
            {
                options.CacheProfiles.Add("Default",
                    new CacheProfile()
                    {
                        Location = ResponseCacheLocation.None,
                        NoStore = true
                    });
            }).AddNewtonsoftJson();

            services.AddSingleton<IKustoQueryService, KustoQueryService>();
            services.AddSingleton<IKustoTokenRefreshService, KustoTokenRefreshService>();
            services.AddSingleton<IArmService, ArmService>();
            services.AddSingleton<IEncryptionService, EncryptionService>();
            services.AddSingleton<IAppInsightsService, AppInsightsService>();
            services.AddSingleton<IHealthCheckService, HealthCheckService>();
            if (!string.IsNullOrWhiteSpace(Configuration.GetValue("ContentSearch:Ocp-Apim-Subscription-Key", string.Empty)))
            {
                services.AddSingleton<IBingSearchService, BingSearchService>();
            }
            else
            {
                services.AddSingleton<IBingSearchService, BingSearchServiceDisabled>();
            }

            if (Configuration.GetValue("OpenAIService:Enabled", false))
            {
                services.AddSingleton<IOpenAIService, OpenAIService>();
                if (Configuration.GetValue("OpenAIService:RedisEnabled", false))
                {
                    services.AddSingleton(async x => await RedisConnection.InitializeAsync(true, connectionString: Configuration["OpenAIService:RedisConnectionString"].ToString()));
                    services.AddSingleton<IOpenAIRedisService, OpenAIRedisService>();
                }
                else
                {
                    services.AddSingleton<IOpenAIRedisService, OpenAIRedisServiceDisabled>();
                }
            }
            else
            {
                services.AddSingleton<IOpenAIService, OpenAIServiceDisabled>();
            }

            // https://stackoverflow.com/questions/52036998/how-do-i-get-a-reference-to-an-ihostedservice-via-dependency-injection-in-asp-ne
            services.AddSingleton<CertificateService>();
            services.AddHostedService(p => p.GetRequiredService<CertificateService>());
        }



        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();

                app.UseCors(cors =>
                   cors
                   .AllowAnyHeader()
                   .AllowAnyMethod()
                   .AllowAnyOrigin()
                );
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
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

        }
    }
}
