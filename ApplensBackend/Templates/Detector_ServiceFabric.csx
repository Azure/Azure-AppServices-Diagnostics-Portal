using System;
using System.Threading;

[ArmResourceFilter(provider: "Microsoft.ServiceFabric", resourceTypeName: "clusters")]
[Definition(
    Id = "YOUR_DETECTOR_ID", 
    Name = "YOUR_DETECTOR_TITLE", 
    Author = "sfapplensreview", 
    Category = "InReview",    
    Description = ""
)]
public async static Task<Response> Run(DataProviders dp, OperationContext<ArmResource> cxt, Response res)
{
    res.Dataset.Add(new DiagnosticData()
    {
        Table = await dp.Kusto.ExecuteClusterQuery(GetQuery(cxt), "KUSTO_CLUSTER_NAME", "KUSTO_DB_NAME", null, "GetQuery"),
        RenderingProperties = new Rendering(RenderingType.Table)
		{
            Title = "Sample Table", 
            Description = "Some description here"
        }
    });

    return res;
}

private static string GetQuery(OperationContext<ArmResource> cxt)
{
    return
    $@"
		let startTime = datetime({cxt.StartTime});
		let endTime = datetime({cxt.EndTime});
		YOUR_TABLE_NAME
		| where Timestamp >= startTime and Timestamp <= endTime
		YOUR_QUERY
	";
}