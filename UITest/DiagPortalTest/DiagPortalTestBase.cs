using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;

namespace DiagPortalTest
{

    class DiagPortalTestBase
    {
        protected string _resourceUri;
        protected string _slot;
        protected IWebDriver _driver;
        protected string _region;
        protected TestContext _testContext;
        protected string _appType;

        public DiagPortalTestBase(IWebDriver driver, TestContext testContext, string appType, string resourceUri, string slot, string region)
        {
            _resourceUri = resourceUri;
            _slot = slot;
            _driver = driver;
            _region = region;
            _testContext = testContext;
            _appType = appType;
        }

        protected virtual void TakeAndSaveScreenshot(string fileName)
        {
            _driver.TakeAndSaveScreenShot(_testContext, fileName);
        }

        protected virtual void Run()
        {

        }

        public void TestWithRetry(int maxRetries = 3, int retryDelayInSecond = 2)
        {
            int retryCount = 0;
            var exceptions = new List<Exception>();
            Exception attemptException = null;
            do
            {
                try
                {
                    attemptException = null;
                    Run();
                    break;
                }
                catch (Exception e)
                {
                    attemptException = e;
                    exceptions.Add(e);
                }
                finally
                {
                    if (attemptException != null)
                    {
                        Console.WriteLine($"Retry Attempt {retryCount} is Failed. {attemptException.Message}");
                    }
                    else
                    {
                        Console.WriteLine($"Retry Attempt {retryCount} is Successful");
                    }
                    TakeAndSaveScreenshot($"RetryAttempt{retryCount}_{this.GetType().Name}_{_appType}");
                    retryCount++;
                }
                if (retryCount < maxRetries)
                {
                    Thread.Sleep(retryDelayInSecond * 1000);
                }
            } while (retryCount < maxRetries);

            if (attemptException != null)
            {
                var aggregateException = new AggregateException($"Failed {maxRetries} retries. Look at inner exceptions", exceptions);
                Assert.Fail(aggregateException.ToString());
            }
        }


        protected IWebElement GetIframeElement(int index = 0)
        {
            _driver.SwitchTo().ParentFrame();
            var iframes = _driver.FindElements(By.CssSelector("iframe.fxs-part-frame:not(.fxs-extension-frame)"));
            var iFrame = iframes.Where((element, i) => i == index).FirstOrDefault();
            return iFrame;
        }

        protected string GetWebsitesExtensionPath(string slot, string region)
        {
            string path = "websitesextension_ext=";
            bool isProd = slot.StartsWith("prod", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(slot);
            bool isDefaultRegion = string.IsNullOrEmpty(region);

            if (isProd == true)
            {
                return isDefaultRegion ? "#" : $"{path}asd.region%3D{region}#";
            }
            else
            {
                return isDefaultRegion ? $"{path}asd.env%3D{slot}#" : $"{path}asd.env%3D{slot}%26asd.region%3D{region}#";
            }
        }

        protected bool CheckIfDetectorPresent(int timeoutInSeconds = 0)
        {
            var bys = new By[] {
                By.TagName("dynamic-data"),
                By.TagName("loader-detector-view"),
                By.TagName("detector-list-analysis")
            };
            var element = _driver.FindFirstElement(bys, timeoutInSeconds);
            return element?.Displayed ?? false;
        }
    }
}
