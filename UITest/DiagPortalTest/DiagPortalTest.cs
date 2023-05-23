using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Configuration;
using OpenQA.Selenium;
using System.IO;
using System.Threading;
using System;
using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using System.Linq;
using UITestUtilities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiagPortalTest
{
    [TestClass]
    public class DiagPortalTest
    {
        private static IWebDriver _driver;
        private static IConfiguration _config;

        private static string _keyVaultUri;
        private static string _email;
        private static string _password = "";
        private static SecretClient _secretClient;
        private static bool _isProd;
        private static string _portalBaseUrl;

        //Get from runsettings
        private string _slot = "";
        private string _region = "";

        public TestContext TestContext { get; set; }

        [ClassInitialize]
        public static void InitalizeTestClass(TestContext context)
        {
            Action init = () =>
            {
                InitSettings();
                InitBroswerDriver();
                LogIn(context).Wait();
            };

            Action<int, Exception> fail = (retryCount, exception) =>
            {
                _driver?.TakeAndSaveScreenshot(context, $"RetryAttempt{retryCount}_InitPortalTestClass");
            };

            try
            {
                RetryUtilities.Retry(init, fail);
            }
            catch (Exception ex)
            {
                string message = _driver != null ? "Init failed in login" : "Inint failed before login";
                Assert.Fail($"{message}. {ex}");
            }
        }



        private static void InitSettings()
        {
            var builder = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddEnvironmentVariables();

            _config = builder.Build();

            _email = _config[DiagPortalTestConst.DiagPortalTestEmail];
            _keyVaultUri = _config[DiagPortalTestConst.KeyVaultDevUri];
            _portalBaseUrl = _config["portalBaseUrl"];

            _isProd = CheckEnvIsProd();

            GetPassword();
        }

        private static void InitBroswerDriver()
        {
            var extensions = new List<string> { $"{Directory.GetCurrentDirectory()}\\windows10.crx" };
            var arguments = new List<string>();
            if (_isProd)
            {
                arguments.Add("headless");
            }
            else
            {
                arguments.Add("--incognito");
            }
            _driver = BroswerUtilities.GetBroswer(BroswerType.Chrome, arguments, extensions);
            _driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(20);

            Console.WriteLine("Setup Driver Success");
        }

        //For Local, login will go through Basic Auth(already have MS account logged in as system level)
        //For PROD go though login by form
        private static async Task LogIn(TestContext context)
        {
            if (_isProd)
            {
                LogInWithForm();
            }
            else
            {
                await LogInWithBasicAuth();
            }
        }

        /// <summary>
        /// Both baisc auth and form authentiaction for portal, first step of login is entering email, 
        /// </summary>
        private static void LogInEnterEmail()
        {
            _driver.Navigate().GoToUrl(_portalBaseUrl);
            Thread.Sleep(1000);
            Console.WriteLine("Login Start");
            _driver.FindElement(By.Id("i0116")).SendKeys(_email);
            _driver.FindElement(By.Id("i0116")).SendKeys(Keys.Enter);
            Thread.Sleep(1000 * 5);

            Console.WriteLine("Enter Email Success");
        }

        private static void LogInWithForm()
        {
            Console.WriteLine($"Login with Form,isProd is {_isProd}");
            LogInEnterEmail();

            _driver.FindElement(By.Id("FormsAuthentication")).Click();
            Thread.Sleep(500);
            _driver.FindElement(By.Id("passwordInput")).SendKeys(_password);
            _driver.FindElement(By.Id("submitButton")).Click();

            Console.WriteLine("Enter Password Success");


            //Click "Yes" button
            _driver.FindElement(By.Id("idSIButton9")).Click();
            Console.WriteLine("Login Success");
        }

        /// <summary>
        /// Basic Auth login,BiDirectional API only works in Chrome and Edge
        /// </summary>
        /// <returns></returns>
        private static async Task LogInWithBasicAuth()
        {
            Console.WriteLine($"Login with Basic Auth,isProd is {_isProd}");
            NetworkAuthenticationHandler handler = new NetworkAuthenticationHandler()
            {
                UriMatcher = (d) => d.Host.Contains("msft.sts.microsoft.com"),
                Credentials = new PasswordCredentials(_email, _password)
            };

            INetwork networkInterceptor = _driver.Manage().Network;
            networkInterceptor.AddAuthenticationHandler(handler);
            await networkInterceptor.StartMonitoring();
            Console.WriteLine("Start Network Monitoring");

            LogInEnterEmail();

            Console.WriteLine("Login Success with basic auth");
        }


        [TestInitialize()]
        public void TestSetup()
        {
            _slot = TestContext.Properties[DiagPortalTestConst.Slot].ToString();
            _region = TestContext.Properties[DiagPortalTestConst.Region].ToString();
            Console.WriteLine($"Get settings from runsettings, Slot is {(string.IsNullOrEmpty(_slot) ? "Empty" : _slot)}, Region is {(string.IsNullOrEmpty(_region) ? "Empty" : _region)}");
        }


        [ClassCleanup]
        public static void TestClassCleanUp()
        {
            if (_driver != null)
            {
                Console.WriteLine("Quite broswer");
                _driver.Quit();
            }
        }

        [DataTestMethod]
        [JsonFileTestDataAttribute<DiagTestData>("./testConfig.json")]
        public void TestDiagAndSolvePortal(string appType, DiagTestData testConfig)
        {
            var diagAndSolveTester = new DiagAndSolveTest(_driver, TestContext, appType, testConfig, _portalBaseUrl, _slot, _region);

            diagAndSolveTester.TestWithRetry();
        }

        [DataTestMethod]
        [JsonFileTestDataAttribute<DiagTestData>("./testConfig.json")]
        public void TestCaseSubmission(string appType, DiagTestData testConfig)
        {
            var caseSubmissionTester = new CaseSubmissionTest(_driver, TestContext, appType, testConfig, _portalBaseUrl, _slot, _region);

            caseSubmissionTester.TestWithRetry();

        }

        //For Local, get passowrd from dev keyvault directly
        //For Prod, Pipeline task for fetching password from KeyVault and assign to runsetting propertey. 
        private static void GetPassword()
        {
            string message;
            if (_isProd)
            {
                _password = Environment.GetEnvironmentVariable(DiagPortalTestConst.DiagPortalTestPassword, EnvironmentVariableTarget.User);
                message = $"Fetch Password from environment variable.";

            }
            else
            {
                _secretClient = new SecretClient(new Uri(_keyVaultUri), new DefaultAzureCredential());
                _password = _secretClient.GetSecret(DiagPortalTestConst.DiagPortalTestPassword).Value.Value;
                message = $"Fetch Password from KeyVault.";
            }

            if (_password.Length == 0)
            {
                message = $"Cannot get Password.";
            }

            if (_password.Length > 0)
            {
                int length = _password.Length;
                var maskedPswArray = _password.ToCharArray().Select((c, i) =>
                {
                    return i == 0 || i == length - 1 ? c : '*';
                }).ToArray();
                string maskedPsw = new string(maskedPswArray);
                Console.WriteLine($"Masked Password is {maskedPsw}");
            }
            Console.WriteLine(message);

        }

        private static bool CheckEnvIsProd()
        {
            string environment = GetValueFromEnvironmentVariable(DiagPortalTestConst.DiagPortalTestEnvironment);
            bool isProd = environment.StartsWith("Prod", StringComparison.CurrentCultureIgnoreCase);
            Console.WriteLine($"IsProd is {isProd}");
            return isProd;
        }

        private static string GetValueFromEnvironmentVariable(string name)
        {
            string value = Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.User) ?? string.Empty;
            return value;
        }
    }
}

