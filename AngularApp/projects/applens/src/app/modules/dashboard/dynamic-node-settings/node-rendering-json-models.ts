import { RenderingType, TimeSeriesType } from "diagnostic-data";
import { NormalPeoplePickerBase } from "office-ui-fabric-react";
import { NoCodeSupportedRenderingTypes } from "../models/detector-designer-models/node-models";

export class NoCodeExpressionBody {
    DetectorId: string;
    Text: string;
    OperationName: string;
    NodeSettings: NodeSettings;
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
    response: string;
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
        return JSON.stringify(this);
    }
}

export class RenderingSettingsBase {
    //renderingType: NoCodeSupportedRenderingTypesRMs = NoCodeSupportedRenderingTypesRMs.Table;
    renderingType: RenderingType = RenderingType.Table;
    isVisible: boolean = true;
}

export class NoCodeTableRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Table;
    title?: string;
    description?: string;
  }

export class NoCodeMarkdownRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Markdown;
  }

export class NoCodeInsightRenderingProperties extends RenderingSettingsBase {
    renderingType: RenderingType = RenderingType.Insights;
    isExpanded: boolean = true;
  }

export class NoCodeGraphRenderingProperties extends RenderingSettingsBase{
    renderingType: RenderingType = RenderingType.TimeSeries;
    title?: string;
    description?: string;
    graphType?: TimeSeriesType;
    graphDefaultValue?: number;
  }

export class DataSourceSettingsBase {
    dataSourceType:NoCodeSupportedDataSourceTypes = NoCodeSupportedDataSourceTypes.Kusto;
}

export class testDatasettings extends DataSourceSettingsBase {
  connectionString: string = '@stampcluster/wawsprod';
}

export class KustoDataSourceSettings extends DataSourceSettingsBase {
    dataBaseName: string = "wawsprod";
    clusterName: string = "@stampcluster";

    public getConnectionString() {
        return `https://${this.clusterName}.kusto.windows.net/${this.dataBaseName}`
    }

    public GetJson(): string {
        return JSON.stringify(this);
    }
}