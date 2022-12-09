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

            services.AddAuthentication(auth =>
            {
                auth.DefaultScheme = AzureADDefaults.BearerAuthenticationScheme;
            })
            .AddAzureADBearer(options =>
            {
                configuration.Bind("AzureAd", options);
            });
            if (configuration["ServerMode"] != "internal")
            {
                services.AddHttpContextAccessor();
                AuthorizationTokenService.Instance.Initialize(configuration);
            }

            services.AddAuthorization(options =>
            {
                var applensAccess = new SecurityGroupConfig();
                configuration.Bind("ApplensAccess", applensAccess);

                options.AddPolicy("DefaultAccess", policy =>
                {
                    policy.Requirements.Add(new DefaultAuthorizationRequirement());
                });
                options.AddPolicy(applensAccess.GroupName, policy =>
                {
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
                .AddCookie(options =>
                {
                    options.ForwardDefaultSelector = context =>
                    {
                        string authScheme = null;
                        if (context.Request.Headers.TryGetValue("Authorization", out StringValues authHeaders) && authHeaders[0].StartsWith("Bearer", StringComparison.CurrentCultureIgnoreCase))
                        {
                            authScheme = AzureADDefaults.BearerAuthenticationScheme;
                        }

                        return authScheme;
                    };
                })
                .AddAzureADBearer(options =>
                {
                    configuration.Bind("AzureAd", options);
                });
        }
    }
}
