using System;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Kusto.Cloud.Platform.Security;
using Microsoft.Extensions.Logging;

namespace AppLensV3
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args)
        {
            var tmpConfig = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddEnvironmentVariables()
                .Build();

            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile("appsettings.NationalClouds.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{tmpConfig.GetValue<string>("CloudDomain")}.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{tmpConfig.GetValue<string>("ASPNETCORE_ENVIRONMENT")}.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables()
                .AddCommandLine(args)
                .Build();

            var assemblyName = typeof(Startup).GetTypeInfo().Assembly.FullName;

            var webHostBuilder = Host.CreateDefaultBuilder(args).ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseConfiguration(config);
                webBuilder.UseStartup(assemblyName);
            });

            if (config.GetValue<bool>("useHttps"))
            {
                var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
                store.Open(OpenFlags.ReadOnly);
                var serverCertificate = store.Certificates.FirstOrDefault(cert => cert.GetEnahncedKeyUsages("Server Authentication", "1.3.6.1.5.5.7.3.1").Any());
                webHostBuilder = Host.CreateDefaultBuilder(args).ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseKestrel(options =>
                    {
                        options.Listen(IPAddress.Loopback, 5001, listenOptions =>
                        {
                            listenOptions.UseHttps(serverCertificate);
                        });
                    });
                    webBuilder.UseConfiguration(config);
                    webBuilder.UseStartup(assemblyName);
                });
            }

            if (config.GetValue("ASPNETCORE_ENVIRONMENT", "Production").Equals("Development", StringComparison.CurrentCultureIgnoreCase))
            {
                webHostBuilder.ConfigureLogging((logging) =>
                {
                    logging.ClearProviders();
                    logging.AddConsole();
                    logging.AddDebug();
                });
            }

            if (config.GetValue("ASPNETCORE_ENVIRONMENT", "Production").Equals("Production", StringComparison.CurrentCultureIgnoreCase))
            {
                webHostBuilder.ConfigureLogging((logging) =>
                {
                    logging.ClearProviders();
                    logging.AddApplicationInsights();

                    if (config.GetValue<bool>("FileLogging:Enabled"))
                    {
                        logging.AddProvider(new FileLoggerProvider());
                    }
                });
            }

            return webHostBuilder;
        }
    }
}