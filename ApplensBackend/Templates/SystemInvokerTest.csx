private static string GetQuery(Dictionary<string, dynamic> cxt)
{
    return
    $@"<YOUR_QUERY>";
}

[SystemFilter]
[Definition(Id = "<YOUR_DETECTOR_ID>", Name = "<YOUR_DETECTOR_NAME>", Author = "<YOUR_ALIAS>", Description = "")]
public async static Task<Response> Run(DataProviders dp, Dictionary<string, dynamic> cxt, Response res)
{
    res.Dataset.Add(new DiagnosticData()
    {
		Table = await dp.Kusto.ExecuteClusterQuery(GetQuery(cxt))
    });

    return res;
}