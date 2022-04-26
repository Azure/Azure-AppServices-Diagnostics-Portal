using System;
using System.Threading;

private static string GetQuery(OperationContext<App> cxt)
{
    return
    $@"
		let startTime = datetime({cxt.StartTime});
		let endTime = datetime({cxt.EndTime});
		cluster('ClusterName').database('DBName').YOUR_TABLE_NAME
		| where TIMESTAMP >= startTime and TIMESTAMP <= endTime
		YOUR_QUERY
	";
}

[AppFilter(AppType = AppType.WorkflowApp, PlatformType = PlatformType.Windows | PlatformType.Linux, StackType = StackType.All)]
[Definition(Id = "YOUR_DETECTOR_ID", Name = "", Author = "YOUR_ALIAS", Description = "")]
public async static Task<Response> Run(DataProviders dp, OperationContext<App> cxt, Response res)
{
    res.Dataset.Add(new DiagnosticData()
    {
        Table = await dp.Kusto.ExecuteClusterQuery(GetQuery(cxt), null, "GetQuery"), 
        RenderingProperties = new Rendering(RenderingType.Table){
            Title = "Sample Table", 
            Description = "Some description here"
        }
    });

    return res;
}