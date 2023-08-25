using System;
using System.IO;
using System.Threading.Tasks;
using Backend.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.ApplicationInsights.AspNetCore.Extensions;
using Microsoft.ApplicationInsights.Extensibility;
using Microsoft.AspNetCore.Mvc;
using Backend.Hubs;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Backend.Services.ArmTokenValidator;
using CommonLibrary.Models;
using CommonLibrary.Services;

namespace Backend
{
    public class Startup
    {
        public Startup(IWebHostEnvironment env)
        {
            Environment = env;
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

            if (true || !Environment.IsDevelopment())
            {
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "ArmAuthentication";
                    options.DefaultChallengeScheme = "ArmAuthentication";
                }).AddJwtBearer("ArmAuthentication", options =>
                {
                    options.RefreshOnIssuerKeyNotFound = true;
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidAudiences = new[] { Configuration["ArmAuthentication:Audience"] },
                        IssuerValidator = ArmTokenValidator.ValidateIssuer
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = context =>
                        {
                            return Task.CompletedTask;
                        },
                        OnAuthenticationFailed = context =>
                        {
                            //TODO: Log this with request id
                            return Task.CompletedTask;
                        },
                        OnMessageReceived = context =>
                        {

                            context.Request.Headers.TryGetValue("Authorization", out var BearerToken);
                            if (BearerToken.Count == 0)
                            {
                                //TODO: Log this with request id
                            }
                            return Task.CompletedTask;
                        }
                    };
                });
            }

            services.AddAuthorization();

            var semanticServiceConfiguration = Configuration.GetSection("SemanticService").Get<SemanticServiceConfiguration>();

            if (semanticServiceConfiguration != null)
            {
                SemanticTokenService.Instance.Initialize(semanticServiceConfiguration);
                services.AddSingleton<ISemanticSearchService, SemanticSearchService>();
            }

            if (Configuration.GetValue("OpenAIService:Enabled", false))
            {
                if (!Environment.IsDevelopment())
                {
                    var connString = Configuration.GetValue<string>("OpenAIService:SignalRConnectionString");
                    if (string.IsNullOrWhiteSpace(connString))
                    {
                        throw new Exception("OpenAI enabled but SignalR connection string not found");
                    }

                    services
                    .AddSignalR(options =>
                    {
                        // Max message size = 2MB
                        options.MaximumReceiveMessageSize = 2 * 1024 * 1024;
                        options.MaximumParallelInvocationsPerClient = 2;
                    }).AddAzureSignalR(connString);
                }
                else
                {
                    services
                    .AddSignalR(options =>
                    {
                        // Max message size = 2MB
                        options.MaximumReceiveMessageSize = 2 * 1024 * 1024;
                        options.MaximumParallelInvocationsPerClient = 2;
                    });
                }

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

            if (Environment.IsDevelopment())
            {
                services.AddCors(options =>
                {
                    options.AddPolicy(
                        "CorsPolicy",
                        builder => builder.WithOrigins("https://localhost:3000", "http://localhost:8080")
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials()
                        .WithExposedHeaders("*"));
                });
            }
        }



        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseCors("CorsPolicy");
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseAuthentication();
            app.UseRouting();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                if (Configuration.GetValue("OpenAIService:Enabled", false))
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

        }
    }
}
