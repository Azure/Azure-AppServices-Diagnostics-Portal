using System;
using System.Collections.Concurrent;
using System.IO;
using System.Text;
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
        private static ConcurrentQueue<string> messages = new ConcurrentQueue<string>();
        private static Timer logWriting = new Timer(WriteLogs, messages, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
        private static object lockObject = new object();
        private readonly string logCategory;
        private bool isDisposed;
        private bool isTimerDisposed;

        public FileLogger(string category, string filePath)
        {
            logCategory = category;
            logWriter.AutoFlush = true;
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

        private static void WriteLogs(object stateInfo)
        {
            var stateMessages = stateInfo as ConcurrentQueue<string>;
            var sb = new StringBuilder();

            if (stateMessages.Count > 0)
            {
                lock (lockObject)
                {
                    if (stateMessages.Count > 0)
                    {
                        while (stateMessages.TryDequeue(out string logMessage))
                        {
                            sb.AppendLine(logMessage);
                        }

                        logWriter.WriteLineAsync(sb);
                    }
                }
            }
        }
    }
}
