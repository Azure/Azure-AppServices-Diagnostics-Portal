using System;
using System.Threading;

[ArmResourceFilter(provider: "Microsoft.Network", resourceTypeName: "virtualNetworkGateways")]
[Definition(Id = "YOUR_DETECTOR_ID", Name = "", Author = "YOUR_ALIAS", Description = "")]
public async static Task<Response> Run(DataProviders dp, OperationContext<ArmResource> cxt, Response res)
{
    DataTable myData = await dp.Kusto.ExecuteClusterQuery(GetQuery(cxt), "TheCluster", "The Database", null, "jhats this gather");
    res.Dataset.Add(new DiagnosticData()
    {
        Table = myData, 
        RenderingProperties = new Rendering(RenderingType.Table){
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
		| where TIMESTAMP >= startTime and TIMESTAMP <= endTime
		YOUR_QUERY
	";
}
