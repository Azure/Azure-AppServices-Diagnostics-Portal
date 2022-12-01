using System.IO;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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
            services.AddDstsAuthFlow(configuration, environment);
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
            app.Use(async (context, next) =>
            {
                if (!context.User.Identity.IsAuthenticated)
                {
                    if (!context.Request.Path.ToString().Contains("signin"))
                    {
                        context.Response.Redirect($"https://{context.Request.Host}/federation/signin", false);
                    }
                    else
                    {
                        //The controller is backed by auth, get auth middleware to kick in
                        await next.Invoke();
                    }
                }
                else
                {
                    if (context.Request.Path.ToString().Contains("signin"))
                    {
                        context.Response.Redirect($"https://{context.Request.Host}/index.html", false);
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
                }
            });

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
