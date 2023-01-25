using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using Microsoft.Extensions.Logging;

namespace AppLensV3
{
    public class FileLoggerProvider : ILoggerProvider
    {
        private ConcurrentDictionary<string, ILogger> loggers = new ConcurrentDictionary<string, ILogger>();
        private bool isDisposed;
        private string logFilePath;

        public FileLoggerProvider()
        {
            logFilePath = $"diagnostics-{DateTime.UtcNow.ToString("yyyyMMdd-HHmm")}.log";
        }

        public ILogger CreateLogger(string categoryName)
        {
            var logger = loggers.GetOrAdd(categoryName, (categoryName) => new FileLogger(categoryName, logFilePath));
            return logger;
        }

        public void Dispose()
        {
            if (!isDisposed)
            {
                foreach (IDisposable item in loggers.Values)
                {
                    item.Dispose();
                }

                isDisposed = true;
            }
            else
            {
                throw new InvalidOperationException("FileLogger already disposed");
            }
        }
    }
}
