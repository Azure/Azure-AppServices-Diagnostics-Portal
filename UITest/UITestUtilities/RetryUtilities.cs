using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace UITestUtilities
{
    public class RetryUtilities
    {
        public static void Retry(Action run, int maxRetries = 3, int retryDelayInSecond = 2)
        {
            Retry(run, null, null, maxRetries, retryDelayInSecond);
        }

        public static void Retry(Action run, Action<int, Exception> fail, int maxRetries = 3, int retryDelayInSecond = 2)
        {
            Retry(run, fail, null, maxRetries, retryDelayInSecond);
        }


        public static void Retry(Action run, Action<int, Exception> fail, Action final, int maxRetries, int retryDelayInSecond)
        {
            int retryCount = 0;
            var exceptions = new List<Exception>();
            Exception attemptException = null;
            do
            {
                try
                {
                    attemptException = null;
                    run?.Invoke();
                    break;
                }
                catch (Exception e)
                {
                    fail?.Invoke(retryCount, e);
                    attemptException = e;
                    exceptions.Add(e);
                }
                finally
                {
                    final?.Invoke();

                    if (attemptException != null)
                    {
                        Console.WriteLine($"Retry Attempt {retryCount} is Failed. {attemptException.Message}");
                    }
                    else
                    {
                        Console.WriteLine($"Retry Attempt {retryCount} is Successful");
                    }
                    retryCount++;
                }
                if (retryCount < maxRetries)
                {
                    Thread.Sleep(retryDelayInSecond * 1000);
                }
            } while (retryCount < maxRetries);

            if (attemptException != null)
            {
                var aggregateException = new AggregateException($"Failed {maxRetries} retries. Look at inner exceptions", exceptions);
                throw aggregateException;
            }
        }
    }
}
