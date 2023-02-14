using System.IO;
using AppLensV3.Authorization;
using AppLensV3.Helpers;
using AppLensV3.Middleware;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Primitives;

namespace AppLensV3
{
    public sealed class StartupNationalCloud : IStartup
    {
        public void AddCloudSpecificServices(IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
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
            services.AddSingleton<IBingSearchService, BingSearchServiceDisabled>();

            if (environment.IsProduction())
            {
                services.AddDstsAuthFlow(configuration, environment);
            }

            if (environment.IsDevelopment())
            {
                if (configuration["ServerMode"] == "internal")
                {
                    services.AddTransient<IFilterProvider, LocalFilterProvider>();
                }

                services.AddMvc(setup =>
                {
                    setup.Filters.Add(new AllowAnonymousFilter());
                }).AddNewtonsoftJson();
            }
        }

        public void AddConfigurations(ConfigurationBuilder builder, IWebHostEnvironment env, string cloudDomain)
        {
            builder.SetBasePath(env.ContentRootPath)
                                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                                .AddJsonFile("appsettings.NationalClouds.json", optional: false, reloadOnChange: true)
                                .AddJsonFile($"appsettings.{cloudDomain}.json", optional: false, reloadOnChange: true)
                                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true)
                                .AddEnvironmentVariables();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            app.UseExceptionHandler(errorApp =>
            {
                errorApp.Run(async context =>
                {
                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "text/html";
                    var error = context.Features.Get<IExceptionHandlerPathFeature>();
                    if (error != null)
                    {
                        var path = error.Path;
                        if (error.Path.StartsWith("/api/invoke"))
                        {
                            StringValues headerVals;
                            if (context.Request.Headers.TryGetValue("x-ms-path-query", out headerVals))
                            {
                                path = headerVals[0];
                            }
                        }

                        await context.Response.WriteAsync(error.Error.ToString());
                    }
                });
            });

            app.UseCors(cors =>
                cors
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders(new string[] { HeaderConstants.ScriptEtagHeader }));

            app.UseRouting();
            app.UseAuthorization();
            app.UseAuthentication();

            if (env.IsProduction())
            {
                app.Use(async (context, next) =>
                {
                    if (!context.User.Identity.IsAuthenticated)
                    {
                        await context.ChallengeAsync();
                    }
                    else
                    {
                        await next();
                        if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value) && !context.Request.Path.Value.StartsWith("/api/"))
                        {
                            context.Request.Path = "/index.html";
                            await next();
                        }
                    }
                });
            }

            if (env.IsDevelopment())
            {
                app.Use(async (context, next) =>
                {
                    await next();
                    if (context.Response.StatusCode == 404 && !Path.HasExtension(context.Request.Path.Value) && !context.Request.Path.Value.StartsWith("/api/"))
                    {
                        context.Request.Path = "/index.html";
                        await next();
                    }
                });
            }

            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.UseMiddleware<RequestMiddleware>();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
