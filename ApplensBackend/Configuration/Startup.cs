using System.IO;
using AppLensV3.Helpers;
using AppLensV3.Services;
using AppLensV3.Services.DiagnosticClientService;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.AzureAD.UI;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization;
using AppLensV3.Authorization;
using System.Collections.Generic;
using AppLensV3.Models;
using Microsoft.ApplicationInsights.Extensibility;
using AppLensV3.Services.ApplensTelemetryInitializer;
using Microsoft.ApplicationInsights.AspNetCore.Extensions;
using AppLensV3.Services.AppSvcUxDiagnosticDataService;
using Microsoft.Extensions.Hosting;

namespace AppLensV3
{
    public class Startup
    {
        public Startup(IWebHostEnvironment env)
        {
            Environment = env;
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{System.Environment.GetEnvironmentVariable("CloudDomain") ?? "PublicAzure"}.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                .AddEnvironmentVariables();

            if (env.IsDevelopment())
            {
                builder.AddApplicationInsightsSettings(developerMode: true);
            }

            Configuration = builder.Build();
        }

        public IConfiguration Configuration { get; }

        public IWebHostEnvironment Environment { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var applicationInsightsOptions = new ApplicationInsightsServiceOptions
            {
                InstrumentationKey = Configuration["ApplicationInsights:InstrumentationKey"],
                EnableAdaptiveSampling = false
            };
            services.AddApplicationInsightsTelemetry(applicationInsightsOptions);
            services.AddSingleton<ITelemetryInitializer, ApplensTelemetryInitializer>();

            services.AddSingleton(Configuration);

            GenericCertLoader.Instance.Initialize();
            SupportObserverCertLoader.Instance.Initialize(Configuration);

            services.AddSingleton<IObserverClientService, SupportObserverClientService>();
            services.AddSingleton<IDiagnosticClientService, DiagnosticClient>();

            services.AddSingletonWhenEnabled<IGithubClientService, GithubClientService>(Configuration, "Github");

            services.AddSingletonWhenEnabled<IKustoAuthProvider, KustoAuthProvider>(Configuration, "Kusto");

            services.AddSingletonWhenEnabled<IKustoQueryService, KustoSDKClientQueryService>(Configuration, "Kusto");

            services.AddSingletonWhenEnabled<IOutageCommunicationService, OutageCommunicationService>(Configuration, "OutageComms");

            services.AddSingletonWhenEnabled<ILocalDevelopmentClientService, LocalDevelopmentClientService>(Configuration, "LocalDevelopment");

            services.AddSingletonWhenEnabled<IEmailNotificationService, EmailNotificationService, NullableEmailNotificationService>(Configuration, "EmailNotification");

            services.AddSingletonWhenEnabled<IGraphClientService, GraphClientService, NullableGraphClientService>(Configuration, "Graph");

            services.AddSingletonWhenEnabled<ISupportTopicService, SupportTopicService>(Configuration, "SupportTopicService");

            services.AddSingletonWhenEnabled<ISelfHelpContentService, SelfHelpContentService>(Configuration, "SelfHelpContent");

            services.AddSingletonWhenEnabled<ICosmosDBHandlerBase<ResourceConfig>, CosmosDBHandler<ResourceConfig>>(Configuration, "ApplensTemporaryAccess");

            services.AddSingletonWhenEnabled<IIncidentAssistanceService, IncidentAssistanceService, NullableIncidentAssistanceService>(Configuration, "SelfHelpContent");

            services.AddSingletonWhenEnabled<IResourceConfigService, ResourceConfigService, NullableResourceConfigService>(Configuration, "ResourceConfig");

            services.AddSingletonWhenEnabled<IHealthCheckService, HealthCheckService>(Configuration, "HealthCheckSettings");

            services.AddSingletonWhenEnabled<ISurveysService, SurveysService, NullableSurveysService>(Configuration, "Surveys");

            services.AddSingletonWhenEnabled<ICosmosDBUserSettingHandler, CosmosDBUserSettingHandler>(Configuration, "UserSetting");

            services.AddSingletonWhenEnabled<IDetectorGistTemplateService, TemplateService>(Configuration, "DetectorGistTemplateService");

            services.AddMemoryCache();
            services.AddMvc().AddNewtonsoftJson();

            if (Configuration.GetValue("Graph:Enabled", false))
            {
                GraphTokenService.Instance.Initialize(Configuration);
            }

            // If we are using runtime host directly
            DiagnosticClientToken.Instance.Initialize(Configuration);

            services.AddAuthentication(auth =>
            {
                auth.DefaultScheme = AzureADDefaults.BearerAuthenticationScheme;
            })
            .AddAzureADBearer(options =>
            {
                Configuration.Bind("AzureAd", options);
            });
            if (Configuration["ServerMode"] != "internal")
            {
                services.AddHttpContextAccessor();
                AuthorizationTokenService.Instance.Initialize(Configuration);
            }
            services.AddAuthorization(options =>
            {
                var applensAccess = new SecurityGroupConfig();
                Configuration.Bind("ApplensAccess", applensAccess);

                options.AddPolicy("DefaultAccess", policy =>
                {
                    policy.Requirements.Add(new DefaultAuthorizationRequirement());
                });
                options.AddPolicy(applensAccess.GroupName, policy =>
                {
                    policy.Requirements.Add(new SecurityGroupRequirement(applensAccess.GroupName, applensAccess.GroupId));
                });
            });

            if (Environment.IsDevelopment())
            {
                services.AddSingleton<IAuthorizationHandler, SecurityGroupHandlerLocalDevelopment>();
            }
            else
            {
                services.AddSingleton<IAuthorizationHandler, SecurityGroupHandler>();
            }

            services.AddSingleton<IAuthorizationHandler, DefaultAuthorizationHandler>();

            if (Configuration["ServerMode"] == "internal")
            {
                services.AddTransient<IFilterProvider, LocalFilterProvider>();
            }

            services.AddSingletonWhenEnabled<IAppSvcUxDiagnosticDataService, AppSvcUxDiagnosticDataService, NullableAppSvcUxDiagnosticDataService>(Configuration, "LocationPlacementIdService");
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }


            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] { HeaderConstants.ScriptEtagHeader })
            );


            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

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

            app.UseDefaultFiles();
            app.UseStaticFiles();
        }
    }
}
