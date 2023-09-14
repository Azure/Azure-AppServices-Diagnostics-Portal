import { RenderingType, TimeSeriesType } from "diagnostic-data";
import { NormalPeoplePickerBase } from "office-ui-fabric-react";
import { NoCodeSupportedRenderingTypes } from "../models/detector-designer-models/node-models";
import { AnalysisPickerModel, SupportTopic, SupportTopicPickerModel } from "../models/detector-designer-models/detector-settings-models";

export class NoCodeExpressionBody {
    Text: string;
    OperationName: string;
    NodeSettings: NodeSettings;
    public GetJson(){
      return `{"Text":{${this.Text}},"OperationName":{${this.Text}},"NodeSettings":{${this.NodeSettings.GetJson()}}`
    }
  }
  
  export class NoCodeExpressionResponse {
    res: string;
    kustoQueryText: string;
    kustoQueryUrl: string;
    kustoDesktopUrl: string;
  }

  export enum NoCodeSupportedDataSourceTypes {
    Kusto
  }
  
export class NodeSettings {
    dataSourceSettings: DataSourceSettingsBase = new KustoDataSourceSettings;
    renderingSettings: RenderingSettingsBase = new NoCodeTableRenderingProperties;
    public GetJson(): string {
        return `{"dataSourceSettings":${this.dataSourceSettings.GetJson()},"renderingSettings":${this.renderingSettings.GetJson()}}`
    }
}

export abstract class RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Table;
    isVisible: boolean = true;
    abstract GetJson();
}

export class NoCodeTableRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Table;
    title?: string;
    description?: string;
    public GetJson(){
      return JSON.stringify(this);
    }
  }

export class NoCodeMarkdownRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Markdown;
    public GetJson(){
      return JSON.stringify(this);
    }
  }

export class NoCodeInsightRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Insights;
    isExpanded: boolean = true;
    public GetJson(){
      return JSON.stringify(this);
    }
  }

export class NoCodeGraphRenderingProperties extends RenderingSettingsBase{
    renderingType: RenderingType = RenderingType.TimeSeries;
    title?: string;
    description?: string;
    graphType?: TimeSeriesType;
    graphDefaultValue?: number;
    public GetJson(){
      return JSON.stringify(this);
    }
  }

export abstract class DataSourceSettingsBase {
    dataSourceType:NoCodeSupportedDataSourceTypes = NoCodeSupportedDataSourceTypes.Kusto;
    abstract processScopeString(scope: string);
    abstract isValid(): boolean;
    abstract GetJson(): string;
}
export class  KustoDataSourceSettings extends DataSourceSettingsBase {
    dataBaseName: string = "";
    clusterName: string = "";

    public getConnectionString() {
        return `https://${this.clusterName}.kusto.windows.net/${this.dataBaseName}`
    }

    public processScopeString(scope: string){
      if (scope.includes('/')){
        let sParams = scope.split('/');
        this.clusterName = sParams[0];
        this.dataBaseName = sParams[1];
      }
      else {
        this.clusterName = scope;
        this.dataBaseName = "";
      }
    }

    public GetJson(): string {
        return JSON.stringify(this);
    }

    public isValid(): boolean {
        return this.clusterName != "" && this.dataBaseName != "";
    }
}

export class nodeJson {
  queryName: string;
  nodeExpression: NoCodeExpressionBody;
}

export class NoCodeDetector {
  nodes: NoCodeExpressionBody[] = [];
  id: string = "";
  name: string = "";
  description: string = "";
  author: string = "";
  isInternal: boolean = true;
  platform: string = "";
  appType: string = "";
  stackType: string = "";
  category: string = "";
  supportTopics: SupportTopic[] = [];
  analysisTypes: string[] = [];
}

export class NoCodePackage {
  Id: string;
  DetectorName: string;
  Description: string;
  NoCodeJson: string;
  IsInternal: boolean;
  Author: string;
  CommittedByAlias: string;
  Platform: string;
  AppType: string;
  StackType: string;
  ResourceType: string;
  ResourceProvider: string;
  Nodes: NoCodeExpressionBody[];
}