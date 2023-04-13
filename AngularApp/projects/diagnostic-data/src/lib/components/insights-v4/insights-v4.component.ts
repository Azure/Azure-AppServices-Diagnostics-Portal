import { Component} from "@angular/core";
import { DataRenderBaseComponent } from "../data-render-base/data-render-base.component";
import { RenderingType, InsightsRendering, HealthStatus, DiagnosticData } from "../../models/detector";
import { Insight, InsightUtils } from "../../models/insight";
import { TelemetryService } from "../../services/telemetry/telemetry.service";
import { TelemetryEventNames } from "../../services/telemetry/telemetry.common";
import { LoadingStatus } from "../../models/loading";
import { BehaviorSubject } from "rxjs";
import { Solution, SolutionButtonOption, SolutionButtonPosition, SolutionButtonType } from "../solution/solution";
import { StatusStyles } from "../../models/styles";
import { OpenAIArmService } from './../../../public_api';



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

  solutions: Solution[] = [];
  solutionPanelOpenSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  solutionTitle: string = "";
  solutionButtonPosition = SolutionButtonPosition.Bottom;
  solutionButtonLabel: string = "View Solution";
  solutionButtonType = SolutionButtonType.Button;
  promptPrefix: string = 'Explain this Win32 status code ';

  constructor(protected telemetryService: TelemetryService, private chatService: OpenAIArmService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <InsightsRendering>data.renderingProperties;
    this.insights = InsightUtils.parseInsightRendering(data);
    this.processSolutionButtonOption(this.renderingProperties.solutionButtonOption);
    //this.processInsightsWithAi();
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

  getInsightBackground(status:HealthStatus):string {
    if(this.renderingProperties.isBackgroundPainted) {
      return StatusStyles.getBackgroundByStatus(status);
    }
    return "";
  }

  processSolutionButtonOption(buttonOption: SolutionButtonOption) {
    if(!buttonOption) return;

    if(buttonOption.label && buttonOption.label.length > 0) {
      this.solutionButtonLabel = buttonOption.label;
    }
    if(buttonOption.position != undefined){
      this.solutionButtonPosition = buttonOption.position;
    }
    if(buttonOption.type != undefined) {
      this.solutionButtonType = buttonOption.type;
    }
  }

  processInsightsWithAi() {
    for(let insight of this.insights) {
      insight.data.forEach((text, key, m) => {
        // For each given insight markdown text, we break down into sections with the regex (Win32 status code).
        // Then for each matched section we make call to the OpenAI service to retrieve a resonse which will be shown in tooltip.
        console.log(key + ': ' + text);
        if (text) {
          this.processWithAiService(text, res => {
            m[key] = res;
          },
          err => {
            console.error('failed to retrieve respones from server: ' + err);
          });
        }
      });
    }
  }

  processWithAiService(originalText: string, success: (response: string) => void, err?: (e: any) => void) {
    if (!originalText) {
      return;
    }

    const match: RegExp = /(^|\s)0x[8F][0-9A-F]{7}(\s|\.|$)/ig;
    let slices: any[] = [];
    let lastIndex = 0;
    let r;

    while ((r = match.exec(originalText))) {
      slices.push({ enhance: false, value: r.input.substring(lastIndex, r.index) });
      const s: string = r.input.substring(r.index, match.lastIndex);
      slices.push({ enhance: true, value: s });
      lastIndex = match.lastIndex;
    }
    slices.push({ enhance: false, value: originalText.substring(lastIndex) });

    // For each slice, call OpenAI service and store the response
    slices.forEach(slice => {
      if (slice.enhance) {
//        const dummyResponseText = 'blah blah blah blah for status code ' + slice.value + ' blah blah.';
//        slice.tooltip = '[' + slice.value + '](## "' + dummyResponseText + '")';

          const query: string = this.promptPrefix + slice.value;
          this.chatService.getAnswer(query, true).subscribe((resp) => {
            if (resp) {
              slice.tooltip = '[' + slice.value + '](## "' + resp + '")';
            }
          },
          error => {
            console.error('failed to retrieve respones from server: ' + error);
            slice.tooltip = "Failed to retrieve response from service."; // TODO: The failure won't be shown
          });
      }
    });

    let completedText: string = '';
    slices.forEach(slice => {
      completedText += slice.tooltip || slice.value;
    })

    success(completedText);
  }
}
