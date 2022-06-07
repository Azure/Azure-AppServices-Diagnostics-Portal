using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Extensions.Configuration;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.IO;
using System.Reflection;
using System.Threading;
using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Azure.Security.KeyVault.Secrets;
using Azure.Identity;
using System.Linq;

namespace DiagPortalTest
{
    [TestClass]
    public class DiagPortalTest
    {
        private static IWebDriver _driver;
        private static IConfiguration Config { get; }

        private static readonly string _keyVaultUri = DiagPortalTestConst.KeyVaultDevUri;
        private static readonly string _email = DiagPortalTestConst.DiagPortalTestEmail;
        private static string _password = "";
        private static SecretClient _secretClient;
        private static Dictionary<string, DiagTestData> _testConfig;
        private static bool _isProd;

        //Get from runsettings
        private string _slot = "";
        private string _region = "";

        public TestContext TestContext { get; set; }

        [ClassInitialize]
        public static void InitalizeTestClass(TestContext context)
        {
            _testConfig = JsonConvert.DeserializeObject<Dictionary<string, DiagTestData>>(File.ReadAllText(Path.GetFullPath(DiagPortalTestConst.FilePathForTestConfig)));

            _isProd = CheckEnvIsProd();

            GetPassword();

            var chromeOption = new ChromeOptions();
            var extensionPath = $"{Directory.GetCurrentDirectory()}\\windows10.crx";
            chromeOption.AddExtension(extensionPath);
            if (_isProd)
            {
                chromeOption.AddArgument("headless");
            }
            else
            {
                chromeOption.AddArgument("--incognito");
            }

            _driver = new ChromeDriver(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), chromeOption);
            _driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds(20);

            Console.WriteLine("Setup Driver Success");

            LogIn(context);

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
            Console.WriteLine("Quite broswer");
            _driver.Quit();
        }


        private static void LogIn(TestContext context)
        {
            try
            {
                _driver.Navigate().GoToUrl("https://ms.portal.azure.com/#home");
                Thread.Sleep(1000);
                Console.WriteLine("Login Start");
                _driver.FindElement(By.Id("i0116")).SendKeys(_email);
                _driver.FindElement(By.Id("i0116")).SendKeys(Keys.Enter);
                Thread.Sleep(1000 * 5);

                Console.WriteLine("Enter Email Success");

                _driver.FindElement(By.XPath("//span[text()='Password']")).Click();
                Thread.Sleep(500);
                _driver.FindElement(By.Id("passwordInput")).SendKeys(_password);
                _driver.FindElement(By.Id("submitButton")).Click();

                Console.WriteLine("Enter Password Success");

                var staySignedInPage = _driver.FindElement(By.XPath("//div[text()='Stay signed in?']"));
                if (staySignedInPage != null)
                {
                    _driver.FindElement(By.XPath("//input[@value='Yes']")).Click();
                }
                Console.WriteLine("Login Success");
            }
            catch (Exception e)
            {
                Console.WriteLine("Login Fail");
                Console.WriteLine(e.ToString());

                _driver.TakeAndSaveScreenShot(context, "LoginFailed");

                throw;
            }

        }

        [DataTestMethod]
        [CustomDataSourceAttribute]
        public void TestDiagAndSolvePortal(string appType)
        {
            var testData = GetTestDataForAppType(appType);

            var diagAndSolveTester = new DiagAndSolveTest(_driver, TestContext, appType, testData.ResourceUri, testData.DiagAndSolve, _slot, _region);

            diagAndSolveTester.TestWithRetry();
        }

        [DataTestMethod]
        [CustomDataSourceAttribute]
        public void TestCaseSubmission(string appType)
        {
            var testData = GetTestDataForAppType(appType);
            var caseSubmissionTester = new CaseSubmissionTest(_driver, TestContext, appType, testData.ResourceUri, testData.CaseSubmission, _slot, _region);

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

        private DiagTestData GetTestDataForAppType(string appType)
        {
            if (!_testConfig.TryGetValue(appType, out DiagTestData data))
            {
                throw new Exception($"Cannot get test data for {appType}");
            }
            return data;
        }

        private static string GetValueFromEnvironmentVariable(string name)
        {
            string value = Environment.GetEnvironmentVariable(name, EnvironmentVariableTarget.User) ?? string.Empty;
            return value;
        }
    }



    public class CustomDataSourceAttribute : Attribute, ITestDataSource
    {
        //AppType name matches key in testConfig.json
        public IEnumerable<object[]> GetData(MethodInfo methodInfo)
        {
            //Read all keys from "testConfig.json" file as test input
            var dict = JsonConvert.DeserializeObject<Dictionary<string, DiagTestData>>(File.ReadAllText(Path.GetFullPath(DiagPortalTestConst.FilePathForTestConfig)));
            var keys = dict.Keys;
            foreach (string key in keys)
            {
                yield return new object[] { key };
            }
        }

        public string GetDisplayName(MethodInfo methodInfo, object[] data)
        {
            if (data != null)
            {
                return string.Format("{0}({1})", methodInfo.Name, string.Join(",", data));
            }
            return null;
        }
    }
}

