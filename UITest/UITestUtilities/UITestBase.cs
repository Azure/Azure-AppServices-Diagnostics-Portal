using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using System;

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

        public void TestWithRetry(Action run, int maxRetries = 3, int retryDelayInSecond = 2)
        {
            int retryCount = 0;
            Action<Exception> fail = (Exception e) =>
            {
                TakeAndSaveScreenshot($"RetryAttempt{retryCount}_{this.GetType().Name}_{_key}");
                retryCount++;
            };

            try
            {
                RetryUtilities.Retry(run, fail, maxRetries, retryDelayInSecond);
            }
            catch (Exception e)
            {
                Assert.Fail(e.ToString());
            }
        }

        protected bool CheckIfDetectorPresent(int timeoutInSeconds)
        {
            var bys = new By[] {
                By.TagName("dynamic-data"),
                By.TagName("detector-list-analysis")
            };
            var element = _driver.FindFirstElement(bys, timeoutInSeconds);
            return element?.Displayed ?? false;
        }
    }
}
