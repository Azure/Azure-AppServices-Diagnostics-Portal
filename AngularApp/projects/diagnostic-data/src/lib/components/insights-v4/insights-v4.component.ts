import { Component } from "@angular/core";
import { DataRenderBaseComponent } from "../data-render-base/data-render-base.component";
import { RenderingType, InsightsRendering, HealthStatus, DiagnosticData } from "../../models/detector";
import { Insight, InsightUtils } from "../../models/insight";
import { TelemetryService } from "../../services/telemetry/telemetry.service";
import { TelemetryEventNames } from "../../services/telemetry/telemetry.common";
import { GenericDetectorCopilotService } from '../../services/generic-detector-copilot.service';
import { BehaviorSubject } from "rxjs";
import { Solution, SolutionButtonOption, SolutionButtonPosition, SolutionButtonType } from "../solution/solution";
import { StatusStyles } from "../../models/styles";



@Component({
  selector: 'insights-v4',
  templateUrl: './insights-v4.component.html',
  styleUrls: ['./insights-v4.component.scss']
})
export class InsightsV4Component extends DataRenderBaseComponent {

  DataRenderingType = RenderingType.Insights;
  SolutionButtonType = SolutionButtonType;
  SolutionButtonPosition = SolutionButtonPosition;
  renderingProperties: InsightsRendering;
  public insights: Insight[];
  InsightStatus = HealthStatus;
  copilotEnabled: boolean = false;

  solutions: Solution[] = [];
  solutionPanelOpenSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  solutionTitle: string = "";
  solutionButtonPosition = SolutionButtonPosition.Bottom;
  solutionButtonLabel: string = "View Solution";
  solutionButtonType = SolutionButtonType.Button;

  private rawDiagnosticData: DiagnosticData;


  constructor(protected telemetryService: TelemetryService, private copilotService: GenericDetectorCopilotService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <InsightsRendering>data.renderingProperties;
    this.insights = InsightUtils.parseInsightRendering(data);
    this.processSolutionButtonOption(this.renderingProperties.solutionButtonOption);
    this.rawDiagnosticData = data;

    this.copilotService.isEnabled().subscribe(res => {
      this.copilotEnabled = res;
    });
  }

  toggleInsightStatus(insight: any) {
    insight.isExpanded = this.hasContent(insight) && !insight.isExpanded;
    this.logInsightClickEvent(insight.title, insight.isExpanded, insight.status);
  }

  hasContent(insight: Insight) {
    return insight.hasData() || this.hasSolutions(insight);
  }

  hasSolutions(insight: Insight) {
    return insight.solutions != null && insight.solutions.length > 0;
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

  openSolutionPanel(insight: Insight) {
    this.solutions = insight.solutions;
    this.solutionTitle = insight.title;
    this.solutionPanelOpenSubject.next(true);
  }

  getInsightBackground(status: HealthStatus): string {
    if (this.renderingProperties.isBackgroundPainted) {
      return StatusStyles.getBackgroundByStatus(status);
    }
    return "";
  }

  processSolutionButtonOption(buttonOption: SolutionButtonOption) {
    if (!buttonOption) return;

    if (buttonOption.label && buttonOption.label.length > 0) {
      this.solutionButtonLabel = buttonOption.label;
    }
    if (buttonOption.position != undefined) {
      this.solutionButtonPosition = buttonOption.position;
    }
    if (buttonOption.type != undefined) {
      this.solutionButtonType = buttonOption.type;
    }
  }

  openCopilot(insight: Insight) {

    let speciifcInsightData: DiagnosticData = {
      table: this.rawDiagnosticData.table,
      renderingProperties: this.rawDiagnosticData.renderingProperties
    };

    let statusEnum = HealthStatus;

    speciifcInsightData.table.rows = this.rawDiagnosticData.table.rows.filter(row => statusEnum[row[0]] == insight.status.toString() &&
      row[1] == insight.title);
    this.copilotService.selectComponentAndOpenCopilot(speciifcInsightData);
  }
}
