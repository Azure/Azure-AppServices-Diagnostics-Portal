using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium;
using System;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.IO;
namespace UITestUtilities
{
    public static class WebDriverExtensions
    {
        public static IWebElement[] FindElemestWithMutipleSelectors(this IWebDriver driver, By[] bys)
        {
            var elements = bys.Select(by =>
            {
                try
                {
                    return driver.FindElement(by);
                }
                catch (Exception)
                {
                    return null;
                }
            }).ToArray();

            return elements;
        }

        public static IWebElement[] FindElemestWithMutipleSelectors(this IWebDriver driver, By[] bys, int timeoutInSeconds)
        {
            var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeoutInSeconds));
            return wait.Until(drv => FindElemestWithMutipleSelectors(drv, bys));
        }

        public static IWebElement FindFirstElement(this IWebDriver driver, By[] bys, int timeoutInSeconds = 0)
        {
            IWebElement[] elements;
            if (timeoutInSeconds > 0)
            {
                elements = FindElemestWithMutipleSelectors(driver, bys, timeoutInSeconds);
            }
            else
            {
                elements = FindElemestWithMutipleSelectors(driver, bys);
            }

            return elements.FirstOrDefault(ele => ele != null && ele.Displayed == true);
        }

        public static IWebElement FindElement(this IWebDriver driver, By by, int timeoutInSeconds)
        {
            var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(timeoutInSeconds));
            return wait.Until(drv => drv.FindElement(by));
        }

        public static void TakeAndSaveScreenshot(this IWebDriver driver, TestContext testContext, string fileName)
        {
            var screenShot = (driver as ITakesScreenshot).GetScreenshot();
            string path = $"{Directory.GetCurrentDirectory()}/{fileName}.png";
            screenShot.SaveAsFile(path);
            testContext.AddResultFile(path);
        }
    }
}
