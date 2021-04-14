import { MarkdownService } from 'ngx-markdown';
import { Component } from '@angular/core';
import { DiagnosticData, DynamicInsightRendering, HealthStatus } from '../../models/detector';
import { DynamicInsight } from '../../models/insight';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { LoadingStatus } from '../../models/loading';

@Component({
  selector: 'dynamic-insight-v4',
  templateUrl: './dynamic-insight-v4.component.html',
  styleUrls: ['./dynamic-insight-v4.component.scss','../insights-v4/insights-v4.component.scss']
})
export class DynamicInsightV4Component extends DataRenderBaseComponent {

  renderingProperties: DynamicInsightRendering;

  insight: DynamicInsight;

  InsightStatus = HealthStatus;
  constructor(private _markdownService: MarkdownService, protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DynamicInsightRendering>data.renderingProperties;

    this.parseInsight();
  }

  private parseInsight() {

    // Make sure that we don't render a box within the insight
    this.renderingProperties.innerRendering.title = '';

    this.insight = <DynamicInsight>{
      title: this.renderingProperties.title,
      description: this._markdownService.compile(this.renderingProperties.description),
      status: this.renderingProperties.status,
      isExpanded: this.renderingProperties.expanded != undefined ? this.renderingProperties.expanded : true,
      innerDiagnosticData: <DiagnosticData>{
        renderingProperties: this.renderingProperties.innerRendering,
        table: this.diagnosticData.table
      },
      isRated: false,
      isHelpful: false
    };
  }

  toggleInsightExpanded(insight: DynamicInsight) {
    insight.isExpanded = !insight.isExpanded;
    this.logInsightClickEvent(insight.title, insight.isExpanded, HealthStatus[insight.status]);
  }

  logInsightClickEvent(insightName: string, isExpanded: boolean, status: string) {
    const eventProps: { [name: string]: string } = {
      'Title': insightName,
      'IsExpanded': String(isExpanded),
      'Status': status
    };

    this.logEvent(TelemetryEventNames.InsightTitleClicked, eventProps);
  }

  setInsightComment(insight: any, isHelpful: boolean) {
    if (!insight.isRated) {
      const eventProps: { [name: string]: string } = {
        'Title': insight.title,
        'IsHelpful': String(isHelpful)
      }
      insight.isRated = true;
      insight.isHelpful = isHelpful;
      this.logEvent(TelemetryEventNames.InsightRated, eventProps);
    }
  }

}
