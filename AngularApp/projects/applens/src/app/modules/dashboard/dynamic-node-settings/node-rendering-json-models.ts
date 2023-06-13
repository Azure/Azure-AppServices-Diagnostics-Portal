import { RenderingType, TimeSeriesType } from "diagnostic-data";
import { NormalPeoplePickerBase } from "office-ui-fabric-react";
import { NoCodeSupportedRenderingTypes } from "../models/detector-designer-models/node-models";

export class NoCodeExpressionBody {
    Text: string;
    OperationName: string;
    NodeSettings: NodeSettings;
    public GetJson(){
      return `{"Text":{${this.Text}},"OperationName":{${this.Text}},"NodeSettings":{${this.NodeSettings.GetJson()}}`
    }
    // DataSourceType: NoCodeSupportedDataSourceTypes;
    // ConnectionString: string;
    // RenderingType: RenderingType;
    // RenderingProperties: NoCodeRenderingProperties;
  }

//   export class NoCodeRenderingProperties {
//     isVisible?: boolean = true;
//     type: RenderingType = RenderingType.Table;
//     isExpanded?: boolean;
//     title?: string;
//     description?: string;
//     graphType?: TimeSeriesType;
//     graphDefaultValue?: number;
//   }
  
  export class NoCodeExpressionResponse {
    res: string;
    kustoQueryText: string;
    kustoQueryUrl: string;
    kustoDesktopUrl: string;
  }

  export enum NoCodeSupportedDataSourceTypes {
    Kusto
  }

//   export enum NoCodeSupportedRenderingTypesRMs {
//     Table = RenderingType.Table,
//     Insight = RenderingType.Insights,
//     Graph = RenderingType.TimeSeries,
//     Markdown = RenderingType.Markdown
//   }
  
export class NodeSettings {
    dataSourceSettings: DataSourceSettingsBase = new KustoDataSourceSettings;
    renderingSettings: RenderingSettingsBase = new NoCodeTableRenderingProperties;
    public GetJson(): string {
        return `{"dataSourceSettings":${this.dataSourceSettings.GetJson()},"renderingSettings":${this.renderingSettings.getJson()}}`
    }
}

export abstract class RenderingSettingsBase {
    //renderingType: NoCodeSupportedRenderingTypesRMs = NoCodeSupportedRenderingTypesRMs.Table;
    renderingType: RenderingType = RenderingType.Table;
    isVisible: boolean = true;
    abstract getJson();
}

export class NoCodeTableRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Table;
    title?: string;
    description?: string;
    public getJson(){
      return JSON.stringify(this);
    }
  }

export class NoCodeMarkdownRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Markdown;
    public getJson(){
      return JSON.stringify(this);
    }
  }

export class NoCodeInsightRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Insights;
    isExpanded: boolean = true;
    public getJson(){
      return JSON.stringify(this);
    }
  }

export class NoCodeGraphRenderingProperties extends RenderingSettingsBase{
    renderingType: RenderingType = RenderingType.TimeSeries;
    title?: string;
    description?: string;
    graphType?: TimeSeriesType;
    graphDefaultValue?: number;
    public getJson(){
      return JSON.stringify(this);
    }
  }

export abstract class DataSourceSettingsBase {
    dataSourceType:NoCodeSupportedDataSourceTypes = NoCodeSupportedDataSourceTypes.Kusto;
    abstract processScopeString(scope: string);
    abstract GetJson(): string;
}

// export class testDatasettings extends DataSourceSettingsBase {
//   connectionString: string = '@stampcluster/wawsprod';
// }

export class  KustoDataSourceSettings extends DataSourceSettingsBase {
    dataBaseName: string = "wawsprod";
    clusterName: string = "@stampcluster";

    public getConnectionString() {
        return `https://${this.clusterName}.kusto.windows.net/${this.dataBaseName}`
    }

    public processScopeString(scope: string){
      if (scope.includes('/')){
        let sParams = scope.split('/');
        this.clusterName = sParams[0];
        this.dataBaseName = sParams[1];
      }
      else this.dataBaseName = scope;
    }

    public GetJson(): string {
        return JSON.stringify(this);
    }
}

export class nodeJson {
  queryName: string;
  nodeExpression: NoCodeExpressionBody;
}

export class NoCodeDetectorJson {
  nodes: NoCodeExpressionBody[] = [];
  id: string = "";
  name: string = "";
  description: string = "";
  author: string = "";
}