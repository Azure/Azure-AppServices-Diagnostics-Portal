﻿using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;
using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Web;

namespace DiagPortalTest
{
    class CaseSubmissionTest : DiagPortalTestBase
    {
        private CaseSubmissionItem _caseSubmissionItem;
        public CaseSubmissionTest(IWebDriver driver, TestContext testContext, string appType, string serilizedTestConfig, string slot, string region) : base(driver, testContext, appType, serilizedTestConfig, slot, region)
        {
            this._caseSubmissionItem = _testConfig.CaseSubmission;
        }

        private string GetCaseSubmissionUrl(string resourceUri, string caseSubject)
        {
            string url;
            string websitesExtensionPath = GetWebsitesExtensionPath(_slot, _region);
            string baseUrl = $"https://ms.portal.azure.com/?{websitesExtensionPath}view/WebsitesExtension/SCIFrameBlade/id/";
            string workFlowId = new Guid().ToString();
            string path = $"/source/CaseSubmissionV2-NonContext/supportTopicId/{_caseSubmissionItem.SupportTopicId}/sapSupportTopicId/{_caseSubmissionItem.SapSupportTopicId}/sapProductId/{_caseSubmissionItem.SapProductId}/workflowId/{workFlowId}";
            var optionalParameters = new List<object>()
            {
                new { key = "caseSubject",value = caseSubject },
                new { key = "supportPlans", value= new { supportPlanType = "Internal" } }
            };

            string optionalParametersStr = "/optionalParameters~/" + HttpUtility.UrlEncode(JsonConvert.SerializeObject(optionalParameters));

            url = baseUrl + HttpUtility.UrlEncode(resourceUri) + path + optionalParametersStr;

            return url;
        }

        protected override void Run()
        {
            string url = GetCaseSubmissionUrl(_testConfig.ResourceUri, _caseSubmissionItem.CaseSubject);
            _driver.Navigate().GoToUrl(url);
            Thread.Sleep(1000 * 30);
            var currentIFrame = GetIframeElement(0);
            _driver.SwitchTo().Frame(currentIFrame);
            Assert.IsTrue(CheckIfDetectorPresent(30), "Case Submission Analysis Displayed");
        }
    }
}
