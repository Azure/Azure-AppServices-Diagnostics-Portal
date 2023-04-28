export const openAIChatQueries: any[] = [
    {key: "How to configure autoscale for Azure App Service?", value: "How to configure autoscale for Azure App Service?"},
    {key: "What is the meaning of 500.19 error?", value: "What is the meaning of 500.19 error?"},
    {key: "Summarize this exception message: Application: Crashmon.exe....", value: `Summarize this exception message: Application: Crashmon.exe
    Framework Version: v4.0.30319
    Description: The process was terminated due to an unhandled exception.
    Exception Info: System.Net.WebException
       at System.Net.HttpWebRequest.EndGetResponse(System.IAsyncResult)
       at System.Net.Http.HttpClientHandler.GetResponseCallback(System.IAsyncResult)
    
    Exception Info: System.Net.Http.HttpRequestException
       at System.Runtime.CompilerServices.TaskAwaiter.ThrowForNonSuccess(System.Threading.Tasks.Task)
       at System.Runtime.CompilerServices.TaskAwaiter.HandleNonSuccessAndDebuggerNotification(System.Threading.Tasks.Task)
       at System.Runtime.CompilerServices.TaskAwaiter.ValidateEnd(System.Threading.Tasks.Task)
       at Microsoft.Azure.Storage.Core.Executor.Executor+<ExecuteAsync>d__1\`1[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]].MoveNext()
    
    Exception Info: Microsoft.Azure.Storage.StorageException
       at Microsoft.Azure.Storage.Core.Executor.Executor+<ExecuteAsync>d__1\`1[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]].MoveNext()
       at System.Runtime.CompilerServices.TaskAwaiter.ThrowForNonSuccess(System.Threading.Tasks.Task)
       at System.Runtime.CompilerServices.TaskAwaiter.HandleNonSuccessAndDebuggerNotification(System.Threading.Tasks.Task)
       at Microsoft.Azure.Storage.Core.Executor.Executor+<>c__DisplayClass0_0\`1[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]].<ExecuteSync>b__0()
       at Microsoft.Azure.Storage.Core.Util.CommonUtility.RunWithoutSynchronizationContext[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]](System.Func\`1<System.__Canon>)
       at Microsoft.Azure.Storage.Core.Executor.Executor.ExecuteSync[[System.__Canon, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089]](Microsoft.Azure.Storage.Core.Executor.RESTCommand\`1<System.__Canon>, Microsoft.Azure.Storage.RetryPolicies.IRetryPolicy, Microsoft.Azure.Storage.OperationContext)
       at Microsoft.Azure.Storage.Blob.CloudBlobContainer.ListBlobsSegmented(System.String, Boolean, Microsoft.Azure.Storage.Blob.BlobListingDetails, System.Nullable\`1<Int32>, Microsoft.Azure.Storage.Blob.BlobContinuationToken, Microsoft.Azure.Storage.Blob.BlobRequestOptions, Microsoft.Azure.Storage.OperationContext)
       at Microsoft.Azure.Storage.Blob.CloudBlobContainer.ListBlobsSegmented(Microsoft.Azure.Storage.Blob.BlobContinuationToken)
       at CrashmonCommon.Storage.GetFileCount(System.String)
       at Crashmon.CrashMonitor.ValidateConfiguration(CrashmonCommon.MonitoringSettings ByRef)
       at Crashmon.CrashMonitor.Monitor(System.String[])
       at Crashmon.Program.Main(System.String[])`},
    {key: "How to configure Virtual Network on Azure Kubernetes cluster?", value: "How to configure Virtual Network on Azure Kubernetes cluster?"},
    {key: "What are the Azure App Service resiliency features?", value: "What are the Azure App Service resiliency features?"},
    {key: "How to integrate KeyVault in Azure Function App using azure cli?", value: "How to integrate KeyVault in Azure Function App using azure cli?"},
  ];