using AppLensV3;
using System;
using AppLensV3.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.AzureAD.UI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.WsFederation;
using Microsoft.Extensions.Primitives;
using Microsoft.IdentityModel.Tokens.Saml2;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using Kusto.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using System.Threading.Tasks;

namespace Microsoft.Extensions.DependencyInjection
{
    public static class AuthServiceCollectionExtensions
    {
        public static void AddBearerAuthFlow(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
        {
            if (services == null)
            {
                throw new ArgumentNullException(nameof(services));
            }

            if (configuration == null)
            {
                throw new ArgumentNullException(nameof(configuration));
            }

            if (environment == null)
            {
                throw new ArgumentNullException(nameof(environment));
            }
            
            if (configuration["ServerMode"] != "internal")
            {
                services.AddHttpContextAccessor();
                AuthorizationTokenService.Instance.Initialize(configuration);
            }

            ValidateSecuritySettings(configuration);
            string openIdConfigEndpoint = $"{configuration["SecuritySettings:AADAuthority"]}/.well-known/openid-configuration"; ;
            var configManager = new Microsoft.IdentityModel.Protocols.ConfigurationManager<OpenIdConnectConfiguration>(openIdConfigEndpoint, new OpenIdConnectConfigurationRetriever());
            configManager.AutomaticRefreshInterval = TimeSpan.FromHours(6);
            var config = configManager.GetConfigurationAsync().Result;
            var issuer = config.Issuer;
            var signingKeys = config.SigningKeys;

            services.AddAuthentication(auth =>
            {
                auth.DefaultScheme = AzureADDefaults.BearerAuthenticationScheme;
            }).AddJwtBearer(AzureADDefaults.BearerAuthenticationScheme, options =>
            {
                options.RefreshOnIssuerKeyNotFound = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidAudiences = new[] { configuration["SecuritySettings:ClientId"], $"spn:{configuration["SecuritySettings:ClientId"]}" },
                    ValidIssuers = new[] { issuer, $"{issuer}/v2.0" },
                    IssuerSigningKeys = signingKeys
                };

                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        return Task.CompletedTask;
                    }
                };
            });

            services.AddAuthorization(options =>
            {
                var applensAccess = new SecurityGroupConfig();
                configuration.Bind("ApplensAccess", applensAccess);

                options.AddPolicy("DefaultAccess", policy =>
                {
                    if (!environment.IsDevelopment())
                    {
                        policy.RequireAuthenticatedUser().AddAuthenticationSchemes(AzureADDefaults.BearerAuthenticationScheme);
                    }
                    policy.Requirements.Add(new DefaultAuthorizationRequirement());
                });
                options.AddPolicy(applensAccess.GroupName, policy =>
                {
                    if (!environment.IsDevelopment())
                    {
                        policy.RequireAuthenticatedUser().AddAuthenticationSchemes(AzureADDefaults.BearerAuthenticationScheme);
                    }
                    policy.Requirements.Add(new SecurityGroupRequirement(applensAccess.GroupName, applensAccess.GroupId));
                });
            });

            if (environment.IsDevelopment())
            {
                services.AddSingleton<IAuthorizationHandler, SecurityGroupHandlerLocalDevelopment>();
            }
            else
            {
                services.AddSingleton<IAuthorizationHandler, SecurityGroupHandler>();
            }

            services.AddSingleton<IAuthorizationHandler, DefaultAuthorizationHandler>();

            if (configuration["ServerMode"] == "internal")
            {
                services.AddTransient<IFilterProvider, LocalFilterProvider>();
            }
        }

        public static void AddDstsAuthFlow(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
        {
            services.AddAuthorization(options =>
            {
                options.AddPolicy("DefaultAccess", policy =>
                {
                    policy.Requirements.Add(new DefaultAuthorizationRequirement());
                });
                options.AddPolicy("ApplensAccess", policy =>
                {
                    policy.Requirements.Add(new SecurityGroupRequirement("ApplensAccess", string.Empty));
                });
            });

            services.AddSingleton<IAuthorizationHandler, SecurityGroupHandlerNationalCloud>();

            services.AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = WsFederationDefaults.AuthenticationScheme;
            })
                .AddWsFederation(options =>
                {
                    options.MetadataAddress = configuration["DatacenterFederationConfiguration:MetadataAddress"];
                    options.Wtrealm = configuration["DatacenterFederationConfiguration:Realm"];
                    options.ClaimsIssuer = configuration["DatacenterFederationConfiguration:Issuer"];
                    options.SecurityTokenHandlers = new List<ISecurityTokenValidator> { new Saml2SecurityTokenHandler() };
                })
                .AddCookie();
        }

        private static void ValidateSecuritySettings(IConfiguration configuration)
        {
            var securitySettings = configuration.GetSection("SecuritySettings").GetChildren();
            foreach (var setting in securitySettings)
            {
                if (string.IsNullOrEmpty(setting.Value))
                {
                    throw new Exception($"Configuration {setting.Key} cannot be null or empty");
                }
            }
        }
    }
}
