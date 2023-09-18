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
using CommonLibrary.Models;
using CommonLibrary.Services;
using System.Linq;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Protocols;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authentication;

namespace Backend
{
    public class Startup
    {
        private ILogger<Startup> _logger;
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

            if (!Environment.IsDevelopment() && Configuration.GetValue("ArmAuthentication:Enabled", false))
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
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateIssuerSigningKey = true
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnTokenValidated = context =>
                        {
                            var allowedAppIds = Configuration["ArmAuthentication:AllowedAppIds"].ToLower().Split(',').ToList();
                            var claimPrincipal = context.Principal;
                            var incomingAppId = claimPrincipal.Claims.FirstOrDefault(c => c.Type.Equals("appid", StringComparison.CurrentCultureIgnoreCase)).Value.Trim();
                            if (incomingAppId == null || !allowedAppIds.Exists(p => p.Equals(incomingAppId, StringComparison.OrdinalIgnoreCase)))
                            {
                                context.Fail("Unauthorized Request");
                                _logger.LogError($"ArmAuthentication failed because incoming app id was not allowed, Incoming App Id {incomingAppId}");
                            }
                            return Task.CompletedTask;
                        },
                        OnAuthenticationFailed = context =>
                        {
                            _logger.LogError($"ArmAuthentication failed. {context.Exception}");
                            return Task.CompletedTask;
                        },
                        OnMessageReceived = async context =>
                        {
                            string token = null;
                            context.Request.Headers.TryGetValue("Authorization", out var BearerToken);
                            if (BearerToken.Count == 0)
                            {
                                var accessToken = context.Request.Query["access_token"].ToString();
                                if (!string.IsNullOrWhiteSpace(accessToken))
                                {
                                    token = accessToken;
                                }
                            }
                            else
                            {
                                if (BearerToken[0].StartsWith("Bearer "))
                                {
                                    token = BearerToken[0].Substring("Bearer ".Length);
                                }
                            }
                            if (!string.IsNullOrWhiteSpace(token)) {
                                //Set relevant validation parameters for the tenant of the token
                                context.Token = token;
                                var jwtToken = new JwtSecurityToken(token);
                                var tenantId = jwtToken.Claims.FirstOrDefault(c => c.Type == "tid")?.Value;

                                if (string.IsNullOrEmpty(tenantId))
                                {
                                    _logger.LogError("Tenant ID claim (tid) not found in the token.");
                                }

                                var configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                                    jwtToken.Issuer.StartsWith("https://sts.windows.net/") ?
                                    $"https://sts.windows.net/{tenantId}/.well-known/openid-configuration" :
                                    $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration",
                                    new OpenIdConnectConfigurationRetriever());

                                var openIdConfig = await configurationManager.GetConfigurationAsync(context.HttpContext.RequestAborted);

                                options.TokenValidationParameters.ValidIssuer = openIdConfig.Issuer;
                                options.TokenValidationParameters.IssuerSigningKeys = openIdConfig.SigningKeys;
                            }
                            else
                            {
                                _logger.LogInformation($"The request did not have an access token in neither the header nor the query params");
                            }
                            return;
                        }
                    };
                });
            }
            else
            {
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "ArmAuthentication";
                    options.DefaultChallengeScheme = "ArmAuthentication";
                }).AddScheme<AuthenticationSchemeOptions, DevelopmentAuthHandler>("ArmAuthentication", options => { });
            }
            services.AddAuthorization();

            var semanticServiceConfiguration = Configuration.GetSection("SemanticService").Get<SemanticServiceConfiguration>();
            services.AddSingleton(semanticServiceConfiguration);

            if (semanticServiceConfiguration != null && semanticServiceConfiguration.Enabled)
            {
                if (!Environment.IsDevelopment())
                {
                    SemanticTokenService.Instance.Initialize(semanticServiceConfiguration);
                }
                services.AddSingleton<ISemanticSearchService, SemanticSearchService>();
            }
            else{
                services.AddSingleton<ISemanticSearchService, SemanticSearchServiceDisabled>();
            }

            var openAIServiceConfiguration = Configuration.GetSection("OpenAIService").Get<OpenAIServiceConfiguration>();

            if (openAIServiceConfiguration.Enabled)
            {
                services.AddSingleton(openAIServiceConfiguration);
                if (!Environment.IsDevelopment())
                {
                    if (string.IsNullOrWhiteSpace(openAIServiceConfiguration.SignalRConnectionString))
                    {
                        throw new Exception("OpenAI enabled but SignalR connection string not found");
                    }

                    services
                    .AddSignalR(options =>
                    {
                        // Max message size = 2MB
                        options.MaximumReceiveMessageSize = 2 * 1024 * 1024;
                        options.MaximumParallelInvocationsPerClient = 2;
                    }).AddAzureSignalR(openAIServiceConfiguration.SignalRConnectionString);
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
                if (openAIServiceConfiguration.RedisEnabled)
                {
                    services.AddSingleton(async x => await RedisConnection.InitializeAsync(true, connectionString: openAIServiceConfiguration.RedisConnectionString));
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
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> logger)
        {
            _logger = logger;
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
