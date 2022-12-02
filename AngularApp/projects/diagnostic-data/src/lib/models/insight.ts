import {
  DetectorResponse,
  DiagnosticData,
  DynamicInsightRendering,
  HealthStatus,
  Rendering,
  RenderingType
} from './detector';
import { Solution } from '../components/solution/solution';

export class InsightBase {
  status: HealthStatus;
  title: string;
  isRated: boolean = false;
  isHelpful: boolean = false;
  isExpanded: boolean = false;

  constructor(status: string, title: string, isExpanded: boolean) {
    this.title = title;
    this.status = HealthStatus[status];
    this.isExpanded = isExpanded;
  }
}

export class Insight extends InsightBase {
  data: Map<string, string>;
  solutions: Solution[] = null;

  constructor(
    status: string,
    title: string,
    isExpanded: boolean,
    solutions?: Solution[]
  ) {
    super(status, title, isExpanded);
    this.data = new Map<string, string>();
    if (solutions) {
      this.solutions = solutions;
    }
  }

  getKeys(): string[] {
    return Object.keys(this.data);
  }

  hasData(): boolean {
    return Object.keys(this.data).length > 0;
  }
}

export class InsightUtils {
  static parseAllInsightsFromResponse(
    response: DetectorResponse,
    withDynamicInsights = false
  ): Insight[] {
    let insightDiagnosticData = response.dataset.filter((data) => {
      const type = (<Rendering>data.renderingProperties).type;

      if (withDynamicInsights) {
        return type === RenderingType.Insights || RenderingType.DynamicInsight;
      } else {
        return type === RenderingType.Insights;
      }
    });

    let allInsights: Insight[] = [];
    insightDiagnosticData.forEach((diagnosticData: DiagnosticData) => {
      const type = (<Rendering>diagnosticData.renderingProperties).type;
      switch (type) {
        case RenderingType.Insights:
          let insights = this.parseInsightRendering(diagnosticData);
          insights.forEach((insight) => allInsights.push(insight));
          break;
        case RenderingType.DynamicInsight:
          let dynamicInsight =
            DynamicInsightUtils.parseDynamicInsightFromResponse(diagnosticData);
          allInsights.push(dynamicInsight);
          break;
        default:
          break;
      }
    });
    return allInsights;
  }

  static parseInsightRendering(diagnosticData: DiagnosticData): Insight[] {
    const insights: Insight[] = [];
    const data = diagnosticData.table;

    const statusColumnIndex = 0;
    const insightColumnIndex = 1;
    const nameColumnIndex = 2;
    const valueColumnIndex = 3;
    const isExpandedIndex = 4;
    const solutionsIndex = 5;

    for (let i: number = 0; i < data.rows.length; i++) {
      let insight: Insight;
      const row = data.rows[i];
      const insightName = row[insightColumnIndex];
      const nameColumnValue = row[nameColumnIndex];

      let solutionsValue = null;
      if (solutionsIndex < row.length && row[solutionsIndex] !== '') {
        solutionsValue = <Solution[]>JSON.parse(row[solutionsIndex]);
      }

      if (
        (insight = insights.find((ins) => ins.title === insightName)) == null
      ) {
        const isExpanded: boolean =
          row.length > isExpandedIndex
            ? row[isExpandedIndex].toLowerCase() === 'true'
            : false;
        insight = new Insight(
          row[statusColumnIndex],
          insightName,
          isExpanded,
          solutionsValue
        );
        insights.push(insight);
      }

      if (nameColumnValue && nameColumnValue.length > 0) {
        insight.data[nameColumnValue] = `${row[valueColumnIndex]}`;
      }
    }

    return insights;
  }
}

export class DynamicInsight extends InsightBase {
  description: string;
  innerDiagnosticData: DiagnosticData;
  hyperlink?: string = null;
  hyperlinkText?: string = null;
}

class DynamicInsightUtils {
  static parseDynamicInsightFromResponse(
    diagnosticData: DiagnosticData
  ): Insight {
    const renderingProperties = <DynamicInsightRendering>(
      diagnosticData.renderingProperties
    );
    const status = HealthStatus[renderingProperties.status];
    const title = renderingProperties.title;
    const expanded = renderingProperties.expanded;
    return new Insight(status, title, expanded);
  }
}
