using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using System;
using System.Threading;

namespace DiagPortalTest
{
    class DiagAndSolveTest : DiagPortalTestBase
    {
        private DiagAndSolveItem _diagAndSolveItem;
        public DiagAndSolveTest(IWebDriver driver, TestContext testContext, string appType, DiagTestData testConfig, string baseUrl, string slot, string region) : base(driver, testContext, appType, testConfig, baseUrl, slot, region)
        {
            this._diagAndSolveItem = _testConfig.DiagAndSolve;
        }

        private void NavigateToHomePage()
        {
            string url;
            if (string.IsNullOrEmpty(_diagAndSolveItem.DiagPortalPath))
            {
                url = GetDiagPortallUrl(_testConfig.ResourceUri, "troubleshoot", _slot, _region);
            }
            else
            {
                url = GetDiagPortallUrl(_testConfig.ResourceUri, _diagAndSolveItem.DiagPortalPath, _slot, _region);
            }

            _driver.Navigate().GoToUrl(url);
            Thread.Sleep(1000 * 20);

            var currentIframe = GetIframeElement(0);
            _driver.SwitchTo().Frame(currentIframe);
            Console.WriteLine("Navigated to home page");
        }

        private void TestCategoryOverview()
        {
            Thread.Sleep(1000 * 20);
            string xPathForCategoryTile = $"//h3[contains(text(),'{_diagAndSolveItem.CategoryName}')]//ancestor::div[@class='category-tile']";
            _driver.FindElement(By.XPath(xPathForCategoryTile)).Click();
            Thread.Sleep(1000 * 20);
            var currentIframe = GetIframeElement(1);
            _driver.SwitchTo().Frame(currentIframe);

            bool isSideNavDisplayed = _driver.FindElement(By.XPath("//category-nav//collapsible-menu-item"))?.Displayed ?? false;
            Assert.IsTrue(isSideNavDisplayed, "Side Nav test");

            Assert.IsTrue(CheckIfDetectorPresent(60), "Category Overview test");

            Console.WriteLine("Tested Category Overview page");
        }

        private void TestDetectorInSameCategory()
        {
            string xPathForDetectorInSideNav = $"//collapsible-menu-item//child::span[contains(text(), '{_diagAndSolveItem.DetectorName}')]";
            _driver.FindElement(By.XPath(xPathForDetectorInSideNav)).Click();

            Thread.Sleep(1000 * 20);

            Assert.IsTrue(CheckIfDetectorPresent(40), "Detector Page test");
            Console.WriteLine("Tested Detector page");
        }


        private string GetDiagPortallUrl(string resourceUri, string diagPortalPath, string slot, string region)
        {
            string websitesExtensionPath = GetWebsitesExtensionPath(slot, region);
            string url = $"{_baseUrl}/?{websitesExtensionPath}@microsoft.onmicrosoft.com/resource{resourceUri}/{diagPortalPath}";

            return url;

        }

        protected override void Run()
        {
            NavigateToHomePage();
            TestCategoryOverview();
            TestDetectorInSameCategory();
        }
    }
}
