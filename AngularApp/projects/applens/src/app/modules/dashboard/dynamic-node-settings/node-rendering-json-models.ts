import { RenderingType } from "diagnostic-data";
import { NormalPeoplePickerBase } from "office-ui-fabric-react";

export class MarkdownRenderingJsonModel{
    table: {}
}

export class InsightRenderingJsonModel{
    constructor(queryResult: any){
        let columns = [
            {
                "columnName": "Status",
                "dataType": "String",
                "columnType": null
            },
            {
                "columnName": "Message",
                "dataType": "String",
                "columnType": null
            },
            {
                "columnName": "Data.Name",
                "dataType": "String",
                "columnType": null
            },
            {
                "columnName": "Data.Value",
                "dataType": "String",
                "columnType": null
            },
            {
                "columnName": "Expanded",
                "dataType": "String",
                "columnType": null
            },
            {
                "columnName": "Solutions",
                "dataType": "String",
                "columnType": null
            }
        ];
        //| project Status, Message, Description, Recommended Action, Customer Ready Content
        let data: {name, value}[] = [];
        let status = "";
        let title = "";
        for(var i = 0; i < queryResult.columns.length; i++){
            if(queryResult.columns[i].columnName == "Status") status = queryResult.rows[0][i];
            else if(queryResult.columns[i].columnName == "Message") title = queryResult.rows[0][i];
            else {
                data.push({name: queryResult.columns[i].columnName, value: queryResult.rows[0][i]});
            }
        }
        let rows = [];
        if(data.length > 0)
        data.forEach(entry => {
            rows.push([status, title, entry.name, entry.value, "null"])
        });
        else rows.push([status, title, "", "", "null"]);

        this.table = {
            "tableName": "Table_0",
            "columns": columns,
            "rows": rows
        }
    }

    table;

    getTable(){
        return this.table;
    }
}

export interface NoCodeExpressionBody {
    DetectorId: string;
    Text: string;
    OperationName: string;
    DataSourceType: DataSourceType;
    ConnectionString: string;
    RenderingType: RenderingType;
    RenderingProperties: NoCodeRenderingProperties;
  }

  export class NoCodeRenderingProperties {
    isVisible?: boolean = true;
    type: RenderingType = RenderingType.Table;
    isExpanded?: boolean;
    title?: string;
    description?: string;
  }
  
  export interface NoCodeExpressionResponse {
    response: string;
    kustoQueryText: string;
    kustoQueryUrl: string;
    kustoDesktopUrl: string;
  }

  export enum DataSourceType {
    Kusto
  }