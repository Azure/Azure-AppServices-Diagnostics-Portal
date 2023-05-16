using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Threading;

namespace UITestUtilities
{
    public class UITestBase
    {
        protected IWebDriver _driver;
        protected TestContext _testContext;
        protected string _key;

        public UITestBase(IWebDriver driver, TestContext testContext, string key)
        {
            _driver = driver;
            _testContext = testContext;
            _key = key;
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
                    TakeAndSaveScreenshot($"RetryAttempt{retryCount}_{this.GetType().Name}_{_key}");
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
