using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenQA.Selenium;
using System;
using System.Linq;
using UITestUtilities;

namespace DiagPortalTest
{

    abstract class DiagPortalTestBase : UITestBase
    {
        protected string _slot;
        protected string _region;
        protected string _baseUrl;
        protected DiagTestData _testConfig;

        public DiagPortalTestBase(IWebDriver driver, TestContext testContext, string appType, DiagTestData testConfig, string baseUrl, string slot, string region) : base(driver, testContext, appType)
        {
            _slot = slot;
            _region = region;
            _baseUrl = baseUrl;
            _testConfig = testConfig;
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
    }
}
