using System;
using System.Collections.Concurrent;
using System.IO;
using System.Threading;
using Microsoft.Extensions.Logging;

namespace AppLensV3
{
    public class FileLogger : ILogger, IDisposable
    {
        private static readonly Lazy<StreamWriter> streamWriter = new Lazy<StreamWriter>(() =>
        {
            return new StreamWriter(File.Open($"diagnostics-{DateTime.UtcNow.ToString("yyyyMMdd-HHmm")}.log", FileMode.Append, FileAccess.Write, FileShare.ReadWrite));
        });
        private static readonly StreamWriter logWriter = streamWriter.Value;
        private bool isDisposed;
        private readonly string logCategory;
        private static ConcurrentQueue<string> messages = new ConcurrentQueue<string>();
        private static Timer logWriting = new Timer(WriteLogs, messages, TimeSpan.Zero, TimeSpan.FromSeconds(1));
        private bool isTimerDisposed;

        public FileLogger(string category, string filePath)
        {
            logCategory = category;
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

            if (!isTimerDisposed)
            {
                logWriting.Dispose();
                isTimerDisposed = true;
            }
            else
            {
                throw new InvalidOperationException("Timer already disposed");
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
                messages.Enqueue($"{DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")} [{logLevel}] {logCategory} {state} {exception?.ToString()}");
            }
        }

        private static void WriteLogs(Object stateInfo)
        {
            int buffer = 0;
            var stateMessages = stateInfo as ConcurrentQueue<string>;

            if (stateMessages.Count > 0)
            {
                while (stateMessages.TryDequeue(out string logMessage))
                {
                    if (buffer > 10)
                    {
                        break;
                    }

                    logWriter.WriteLineAsync(logMessage);
                    buffer++;
                }

                logWriter.FlushAsync();
            }
        }
    }
}
