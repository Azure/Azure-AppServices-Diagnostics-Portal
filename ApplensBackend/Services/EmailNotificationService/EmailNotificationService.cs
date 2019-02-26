﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using SendGrid;
using SendGrid.Helpers.Mail;
using System.Data;
using Newtonsoft.Json.Linq;
using System.IO;
using System.Reflection;
using AppLensV3.Models;
using System.Text.RegularExpressions;
using System.Globalization;

namespace AppLensV3.Services.EmailNotificationService
{
    public class EmailNotificationService : IEmailNotificationService
    {
        private IConfiguration _configuration;
        private IKustoQueryService _kustoQueryService;

        private SendGridClient _sendGridClient { get; set; }

        public string SendGridApiKey
        {
            get
            {
                return _configuration["EmailNotification:ApiKey"];
            }
        }

        public string PublishingEmailTemplateId
        {
            get
            {
                return _configuration["EmailNotification:PublishingEmailTemplateId"];
            }
        }

        public string ReportingEmailTemplateId
        {
            get
            {
                return _configuration["EmailNotification:ReportingEmailTemplateId"];
            }
        }

        public EmailNotificationService(IConfiguration configuration, IKustoQueryService kustoQueryService)
        {
            _configuration = configuration;
            _kustoQueryService = kustoQueryService;
            _sendGridClient = InitializeClient();
        }


        private SendGridClient InitializeClient()
        {
            var sendGridClient = new SendGridClient(SendGridApiKey);
            return sendGridClient;
        }

        private static Dictionary<string, string> imageAttachmentsInfo = new Dictionary<string, string>()
        {
            {"microsoftLogo", @"EmailNotificationTemplate\Images\microsoftLogo.png"},
            {"applensBg", @"EmailNotificationTemplate\Images\applensBg.png"},
            {"banner", @"EmailNotificationTemplate\Images\banner.png"},
            {"solidStar", @"EmailNotificationTemplate\Images\solidStar.png"},
            {"halfSolidStar", @"EmailNotificationTemplate\Images\halfSolidStar.png"},
            {"emptyStar", @"EmailNotificationTemplate\Images\emptyStar.png"}
        };

        private List<Attachment> GetImagesAttachments(List<Tuple<string, string, Image, Image, string, string>> supportTopicTrends = null)
        {
            string assemPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            List<Attachment> attachments = new List<Attachment>();

            foreach (KeyValuePair<string, string> staticImage in imageAttachmentsInfo)
            {
                string filePath = Path.Combine(assemPath, staticImage.Value);

                FileInfo fs = new FileInfo(filePath);
                Byte[] imageArray = File.ReadAllBytes(fs.FullName);
                string base64ImageRepresentation = Convert.ToBase64String(imageArray);

                if (!string.IsNullOrWhiteSpace(base64ImageRepresentation))
                {
                    Image image = new Image()
                    {
                        Cid = staticImage.Key,
                        ContentBase64Encoded = base64ImageRepresentation
                    };

                    Attachment imageAttachment = new Attachment();

                    imageAttachment.Content = image.ContentBase64Encoded;
                    imageAttachment.Filename = $"{image.Cid}.png";
                    imageAttachment.ContentId = image.Cid;
                    imageAttachment.Type = "image/jpeg";
                    imageAttachment.Disposition = "inline";

                    attachments.Add(imageAttachment);
                }
            }


            if (supportTopicTrends != null)
            {
                for (int i = 0; i < supportTopicTrends.Count; i++)
                {
                    List<Image> spImages = new List<Image>() { supportTopicTrends[i].Item3, supportTopicTrends[i].Item4 };

                    string imageTags = string.Empty;
                    string imageTags1 = string.Empty;
                    foreach (var image in spImages)
                    {
                        Attachment imageAttachment = new Attachment();
                        imageAttachment.Content = image.ContentBase64Encoded;
                        imageAttachment.Filename = $"{image.Cid}.png";
                        imageAttachment.ContentId = image.Cid;
                        imageAttachment.Type = "image/jpeg";
                        imageAttachment.Disposition = "inline";

                        attachments.Add(imageAttachment);
                    }

                }
            }

            return attachments;
        }

        public async Task<Response> SendEmail(EmailAddress from, List<EmailAddress> tos, string templateId, Object dynamicTemplateData, List<Attachment> attachments = null, List<EmailAddress> ccList = null)
        {
            try
            {
                var emailMessage = new SendGridMessage();
                emailMessage.SetFrom(from);
                emailMessage.AddTos(tos);

                if (ccList != null && ccList.Count > 0)
                {
                    emailMessage.AddCcs(ccList);
                }

                emailMessage.SetTemplateId(templateId);
                emailMessage.SetTemplateData(dynamicTemplateData);

                if (attachments != null)
                {
                    emailMessage.AddAttachments(attachments);
                }

                var response = await _sendGridClient.SendEmailAsync(emailMessage);
                return response;
            }
            catch(Exception e)
            {
                throw e;
            }
        }

        public async Task SendPublishingAlert(string alias, string detectorId, string link, List<EmailAddress> tos, string from = "applensv2team@microsoft.com")
        {
            var fromAddress = new EmailAddress(from, "Applens Notification");
            var dynamicTemplateData = new PublishingTemplateData
            {
                DetectorId = detectorId,
                Alias = alias,
                ApplensLink = link,
                ApplensBg = $@"<img src='cid:applensBg' width='100%' height='53' style='display:block;font-family: Arial, sans-serif; font-size:15px; line-height:18px; color:#30373b;  font-weight:bold;' border='0' alt='LoGo Here' />",
                MicrosoftLogoImage = $@"<img style='display:block;height:auto;' src='cid:microsoftLogo' width='100'>",
            };

            List<Attachment> attachments = GetImagesAttachments();

            await SendEmail(fromAddress, tos, PublishingEmailTemplateId, dynamicTemplateData, attachments);
        }

        private class PublishingTemplateData
        {
            [JsonProperty("DetectorId")]
            public string DetectorId { get; set; }

            [JsonProperty("Alias")]
            public string Alias { get; set; }

            [JsonProperty("ApplensLink")]
            public string ApplensLink { get; set; }

            [JsonProperty("ApplensBg")]
            public string ApplensBg { get; set; }

            [JsonProperty("MicrosoftLogoImage")]
            public string MicrosoftLogoImage { get; set; }
        }
    }


}