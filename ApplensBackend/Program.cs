using System;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Security.Cryptography.X509Certificates;
using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Kusto.Cloud.Platform.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
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
            var tmp = new ConfigurationBuilder()
                            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
            if (tmpConfig.GetValue<string>("ASPNETCORE_ENVIRONMENT").Equals("Development", StringComparison.CurrentCultureIgnoreCase))
            {
                var secretClient = new SecretClient(new Uri($"{tmpConfig.GetValue<string>("KeyVault")}"),
                                                                new DefaultAzureCredential());

                tmp.AddAzureKeyVault(secretClient, new KeyVaultSecretManager());
            }

            tmp.AddJsonFile("appsettings.NationalClouds.json", optional: false, reloadOnChange: true);
            if (tmpConfig.GetValue<string>("CloudDomain") != null && tmpConfig.GetValue<string>("ASPNETCORE_ENVIRONMENT").Equals("Production", StringComparison.CurrentCultureIgnoreCase))
            {
                tmp.AddJsonFile($"appsettings.{tmpConfig.GetValue<string>("CloudDomain")}.json", optional: false, reloadOnChange: true);
            }

            tmp.AddJsonFile($"appsettings.{tmpConfig.GetValue<string>("ASPNETCORE_ENVIRONMENT")}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .AddCommandLine(args).Build();
            var finalConfig = tmp.Build();
            var assemblyName = typeof(Startup).GetTypeInfo().Assembly.FullName;
            var webHostBuilder = Host.CreateDefaultBuilder(args).ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseConfiguration(finalConfig);
                webBuilder.UseStartup(assemblyName);
            });

            if (finalConfig.GetValue<bool>("useHttps"))
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
                    webBuilder.UseConfiguration(finalConfig);
                    webBuilder.UseStartup(assemblyName);
                });
            }

            if (finalConfig.GetValue("ASPNETCORE_ENVIRONMENT", "Production").Equals("Development", StringComparison.CurrentCultureIgnoreCase))
            {
                webHostBuilder.ConfigureLogging((logging) =>
                {
                    logging.ClearProviders();
                    logging.AddConsole();
                    logging.AddDebug();
                });
            }

            if (finalConfig.GetValue("ASPNETCORE_ENVIRONMENT", "Production").Equals("Production", StringComparison.CurrentCultureIgnoreCase))
            {
                webHostBuilder.ConfigureLogging((logging) =>
                {
                    logging.ClearProviders();
                    logging.AddApplicationInsights();

                    if (finalConfig.GetValue<bool>("FileLogging:Enabled"))
                    {
                        logging.AddProvider(new FileLoggerProvider());
                    }
                });
            }

            return webHostBuilder;
        }
    }
}
