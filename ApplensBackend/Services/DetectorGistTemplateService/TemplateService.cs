// <copyright file="TemplateService.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.Extensions.Caching.Memory;

namespace AppLensV3.Services
{

    public class TemplateService : IDetectorGistTemplateService
    {
        private readonly IMemoryCache memoryCache;
        private Task templateTask;

        public TemplateService(IMemoryCache detectorGistCache)
        {
            memoryCache = detectorGistCache;
            templateTask = Task.Run(() =>
            {
                return FillDetectorGistCache();
            });
        }

        public async Task<string> GetTemplate(string name, CancellationToken cancellationToken)
        {
            if (!templateTask.IsCompleted)
            {
                await templateTask;
            }

            if (!memoryCache.TryGetValue(name, out string template))
            {
                throw new FileNotFoundException($"Cannot find template with name: {name}");
            }

            return template;
        }

        private async Task FillDetectorGistCache()
        {
            var exceptions = new List<Exception>();
            var cTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(120));
            var cToken = cTokenSource.Token;

            var files = Directory.GetFiles(Path.Combine(Environment.CurrentDirectory, "Templates"));
            foreach (var file in files)
            {
                try
                {
                    var templateContent = await File.ReadAllTextAsync(file, cToken);

                    memoryCache.Set(Path.GetFileName(file), templateContent, new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(DetectorGistTemplateServiceConstants.MaxCacheTimeInDays)
                    });
                }
                catch (Exception ex)
                {
                    Trace.TraceError($"Error in TemplateService File: {file} ExceptionType {ex.GetType()} Exception Message: {ex.Message}");
                    exceptions.Add(ex);
                }
            }

            if (exceptions.Any())
            {
                throw new AggregateException(exceptions);
            }
        }

    }
}
