using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using System;

namespace UITestUtilities
{
    public abstract class UITestBase
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

        /// <summary>
        /// Method for running the test
        /// </summary>
        public abstract void TestRun();

        /// <summary>
        /// Method for when test failing
        /// </summary>
        /// <param name="retryCount">Current # of retry</param>
        /// <param name="exception">Excetpion</param>
        public abstract void TestFail(int retryCount, Exception exception);

        protected void TakeAndSaveScreenshotForRetry(int retryCount, string testName)
        {
            string fileName = $"RetryAttempt{retryCount}_{testName}_{_key}";
            _driver.TakeAndSaveScreenshot(_testContext, fileName);
        }

        public void TestWithRetry(int maxRetries = 3, int retryDelayInSecond = 2)
        {
            try
            {
                RetryUtilities.Retry(TestRun, TestFail, maxRetries, retryDelayInSecond);
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
