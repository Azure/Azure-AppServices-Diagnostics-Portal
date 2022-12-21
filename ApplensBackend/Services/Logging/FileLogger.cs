using System;
using System.IO;
using Microsoft.Extensions.Logging;

namespace AppLensV3
{
    public class FileLogger : ILogger, IDisposable
    {
        private readonly StreamWriter logWriter;
        private bool isDisposed;
        private readonly string logCategory;

        public FileLogger(string category, string filePath)
        {
            logCategory = category;
            logWriter = new StreamWriter(File.Open(filePath, FileMode.Append, FileAccess.Write, FileShare.ReadWrite));
        }

        public IDisposable BeginScope<TState>(TState state)
        {
            return null;
        }

        public void Dispose()
        {
            if (!isDisposed)
            {
                logWriter.Dispose();
                isDisposed = true;
            }
            else
            {
                throw new InvalidOperationException("FileLogger already disposed");
            }
        }

        public bool IsEnabled(LogLevel logLevel)
        {
            if (logLevel >= LogLevel.None)
            {
                return false;
            }

            return true;
        }

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter)
        {
            if (IsEnabled(logLevel))
            {
                logWriter.WriteLineAsync($"{DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")} [{logLevel}] {logCategory} {state} {exception?.ToString()}");
                logWriter.FlushAsync();
            }
        }
    }
}
