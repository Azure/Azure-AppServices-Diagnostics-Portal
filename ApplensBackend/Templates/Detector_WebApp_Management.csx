private static string OPERATION_NAME = "<YOUR_OPERATION_NAME>";  // eg:- Update, Delete, Swap etc.

[AppFilter(AppType = AppType.All, PlatformType = PlatformType.Windows | PlatformType.Linux, StackType = StackType.All)]
[Definition(Id = "<YOUR_DETECTOR_ID>", Name = "<YOUR_DETECTOR_NAME>", Author = "<YOUR_ALIAS>", Description = "Checks for all management operation of a given type and finds out how many of them succeeded, failed and prints out details of the failed operations")]
public async static Task<Response> Run(DataProviders dp, OperationContext<App> cxt, Response res)
{
    var tblOperations = await dp.Kusto.ExecuteQuery(GetManagementOperations(cxt, OPERATION_NAME), cxt.Resource.Stamp.Name, null, "GetManagementOperations");
    
    res.AddDataSummary(GetOperationSummary(tblOperations));

    res.Dataset.Add(new DiagnosticData()
    {
        Table = GetOperationsTimeline(tblOperations),
        RenderingProperties = new TimeSeriesRendering() {
            Title = "Operations Timeline",
            Description = $"This shows all the operations of type {OPERATION_NAME}",
            GraphType = TimeSeriesType.BarGraph
        }
    });

    await ShowFailedOperationDetails(cxt, dp, tblOperations, res);
    return res;
}

private static string GetManagementOperations(OperationContext<App> cxt, string operationType)
{
    string siteName = cxt.Resource.Name;
    return
        $@"AntaresAdminSubscriptionAuditEvents
        | where {Utilities.TimeAndTenantFilterQuery(cxt.StartTime, cxt.EndTime, cxt.Resource)} 
        | where SiteName startswith '{siteName}(' or SiteName =~ '{siteName}'
        | where OperationType =~ '{operationType}'       
        | project TIMESTAMP, SiteName, RequestId 
        | join kind = leftouter (
            AntaresAdminControllerEvents
            | where {Utilities.TimeAndTenantFilterQuery(cxt.StartTime, cxt.EndTime, cxt.Resource)} 
            | where SiteName =~ '{siteName}' or SiteName startswith '{siteName}(' 
            | where Exception != ''
            | project RequestId, Exception 
            | summarize by RequestId, Exception
        ) on RequestId 
        | extend Status = iif(Exception != '', Exception, 'Success')
        | project-away RequestId1, Exception ";
}

private static List<DataSummary> GetOperationSummary(DataTable tblOperations)
{
    var dataSummaries = new List<DataSummary>();
    dataSummaries.Add(new DataSummary("Total",  tblOperations.Rows.Count.ToString(), "#368cbf"));
    dataSummaries.Add(new DataSummary("Success",  tblOperations.Select("Status = 'Success'").Length.ToString(), "#2a860c"));
    dataSummaries.Add(new DataSummary("Failed",  tblOperations.Select("Status <> 'Success'").Length.ToString(), "#e01f1f"));
    return dataSummaries;
    
}

private static DataTable GetOperationsTimeline(DataTable tblOperations)
{
    Dictionary<DateTime, Operation> dictionaryOperations = new Dictionary<DateTime, Operation>();
    foreach (DataRow row in tblOperations.Rows)
    {
        var dateTime = RoundUp(DateTime.Parse(row["TIMESTAMP"].ToString()), TimeSpan.FromMinutes(5));
        Operation operation = null;

        if (!dictionaryOperations.ContainsKey(dateTime))
        {
            operation = new Operation();
            dictionaryOperations.Add(dateTime, operation);
        }
        
        operation = dictionaryOperations[dateTime];
        if (row["Status"].ToString() != "Success")
       {
            operation.FailedCount++;
        }
        else
        {
            operation.SuccessCount++;
        }
    }

    DataTable timeSeries = new DataTable();
    timeSeries.Columns.AddRange(new DataColumn[]
        {
        new DataColumn("TIMESTAMP", typeof(System.DateTime)),
        new DataColumn("Failed", typeof(int)),
        new DataColumn("Succeeded", typeof(int))
        });

    foreach (var key in dictionaryOperations.Keys)
    {
        var newRow = timeSeries.NewRow();
        newRow["TIMESTAMP"] = key;
        newRow["Succeeded"] = dictionaryOperations[key].SuccessCount;
        newRow["Failed"] = dictionaryOperations[key].FailedCount;
        timeSeries.Rows.Add(newRow);
        
    }

    return timeSeries;
}

private static async Task ShowFailedOperationDetails(OperationContext<App> cxt, DataProviders dp, DataTable tblOperations, Response res)
{
    var failedOperations = GetFailedOperationList(tblOperations, "Status <> 'Success'");
    if (failedOperations.Count > 0)
    {
        var operationDetails  = await dp.Kusto.ExecuteQuery(GetFailedOperationDetailsQuery(cxt, failedOperations), cxt.Resource.Stamp.Name, null, "GetFailedOperationDetailsQuery");
        foreach (var failedActivityId in failedOperations)
       {
            DataView failedOperationDetailsView = operationDetails.DefaultView;
            failedOperationDetailsView.RowFilter = $" (ActivityId = '{failedActivityId}' or RequestId = '{failedActivityId}')";
            DataTable failedOperationsTable = failedOperationDetailsView.ToTable("FailedOperations", true);
            
            res.Dataset.Add(new DiagnosticData()
            {
                Table = failedOperationsTable,
                RenderingProperties = new TableRendering() {
                    Title = $"Detailed Message for Operations with ActivitId = {failedActivityId}",
                    Description = $"This shows all details for an operation with ActivityId - {failedActivityId}"
                }
            });  
        }
    }
}

private static List<string> GetFailedOperationList(DataTable tblOperations, string rowFilter)
{
    var failedOperations = new List<string>();
    foreach(DataRow row in tblOperations.Select(rowFilter))
    {
        var activityId = row["RequestId"].ToString();
        if (!failedOperations.Contains(activityId))
        {
            failedOperations.Add(activityId);
        }
    }
    return failedOperations;
}

private static string GetFailedOperationDetailsQuery(OperationContext<App> cxt, List<string> ActivityIds)
{
    string siteName = cxt.Resource.Name;
    var normalizedActivities = NormalizeActivityIdList(ActivityIds);    
    return
    $@"AntaresAdminControllerEvents
        | where {Utilities.TimeAndTenantFilterQuery(cxt.StartTime, cxt.EndTime, cxt.Resource)}
        | where SiteName =~ '{siteName}' or SiteName startswith '{siteName}(' 
        | where ActivityId in ({normalizedActivities}) or RequestId in ({normalizedActivities})
        | project TIMESTAMP, SiteName, EventId, ActivityId, RequestId, Exception, TraceMessage, Address
        | order by TIMESTAMP asc";
}

private static string NormalizeActivityIdList(List<string> ActivityIds)
{
    var normalizedList = new List<string>();
    foreach (var activity in ActivityIds)
    {
        normalizedList.Add($"'{activity}'");
    }
    return string.Join(",",normalizedList);
}

private static DateTime RoundUp(DateTime dt, TimeSpan d)
{
    return new DateTime((dt.Ticks + d.Ticks - 1) / d.Ticks * d.Ticks, dt.Kind);
}

class Operation
{
    public int FailedCount;
    public int SuccessCount;
}
