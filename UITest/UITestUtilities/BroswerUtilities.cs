using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.Collections.Generic;
using System.IO;
using System.Reflection;

namespace UITestUtilities
{
    public class BroswerUtilities
    {
        public static IWebDriver GetBroswer(BroswerType type, List<string> arguments, List<string> extensions)
        {
            switch (type)
            {
                case BroswerType.Chrome:
                default:
                    var chromeOption = new ChromeOptions();
                    chromeOption.AddArguments(arguments);
                    chromeOption.AddExtensions(extensions);
                    var driver = new ChromeDriver(chromeOption);
                    return driver;
            }
        }

        public static IWebDriver GetBroswer(BroswerType type)
        {
            var argument = new List<string>();
            var extensions = new List<string>();
            return GetBroswer(type, argument, extensions);
        }
    }

    public enum BroswerType
    {
        Chrome
    }
}
