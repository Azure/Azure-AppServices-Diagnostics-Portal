using AppLensV3.Services;
using AppLensV3.Services.DiagnosticClientService;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        private IStartup cloudEnvironmentStartup;

        public Startup(IWebHostEnvironment env)
        {
            Environment = env;

            var tmpBuilder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddEnvironmentVariables();

            var tmpConfiguration = tmpBuilder.Build();

            if (tmpConfiguration.IsPublicAzure())
            {
                cloudEnvironmentStartup = new StartupPublicAzure();
            }

            if (tmpConfiguration.IsAzureUSGovernment() || tmpConfiguration.IsAzureChinaCloud() || tmpConfiguration.IsAirGappedCloud())
            {
                cloudEnvironmentStartup = new StartupNationalCloud();
            }

            var builder = new ConfigurationBuilder();
            cloudEnvironmentStartup.AddConfigurations(builder, env, tmpConfiguration.GetCloudDomain());

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

            services.AddSingletonWhenEnabled<ICosmosDBUserSettingHandler, CosmosDBUserSettingHandler, NullableCosmosDBUserSettingsHandler>(Configuration, "UserSetting");

            services.AddSingletonWhenEnabled<IDetectorGistTemplateService, TemplateService>(Configuration, "DetectorGistTemplateService");

            services.AddSingletonWhenEnabled<IAppSvcUxDiagnosticDataService, AppSvcUxDiagnosticDataService, NullableAppSvcUxDiagnosticDataService>(Configuration, "LocationPlacementIdService");

            services.AddMemoryCache();
            services.AddMvc().AddNewtonsoftJson();

            if (Configuration.GetValue("Graph:Enabled", false))
            {
                GraphTokenService.Instance.Initialize(Configuration);
            }

            if (!Configuration.GetValue<bool>("DiagnosticRole:clientCertEnabled", true))
            {
                DiagnosticClientToken.Instance.Initialize(Configuration);
            }

            cloudEnvironmentStartup.AddCloudSpecificServices(services, Configuration, Environment);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) => cloudEnvironmentStartup.Configure(app, env);
    }
}
