import { Component, Inject } from '@angular/core';
import { MarkdownRendering, DiagnosticData } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { MarkdownService } from 'ngx-markdown';
import { ClipboardService } from '../../services/clipboard.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { GenericDetectorCopilotService } from '../../services/generic-detector-copilot.service';

@Component({
  selector: 'markdown-view',
  templateUrl: './markdown-view.component.html',
  styleUrls: ['./markdown-view.component.scss']
})
export class MarkdownViewComponent extends DataRenderBaseComponent {
  renderingProperties: MarkdownRendering;
  markdownData: string;
  isPublic: boolean;
  rawDiagnosticData : DiagnosticData;
  copilotEnabled: boolean = false;

  constructor(private _markdownService: MarkdownService, private _clipboard: ClipboardService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService, private copilotService: GenericDetectorCopilotService) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    this.rawDiagnosticData = data;
    super.processData(data);
    this.renderingProperties = <MarkdownRendering>data.renderingProperties;

    this.createViewModel();

    this.copilotService.isEnabled().subscribe(res => {
      this.copilotEnabled = res;
    });
  }

  private createViewModel() {
    const rows = this.diagnosticData.table.rows;
    if (rows.length > 0 && rows[0].length > 0) {
      this.markdownData = rows[0][0];
    }
  }

  copyMarkdown() {
    const markdownHtml = this._markdownService.compile(this.markdownData);
    this._clipboard.copyAsHtml(markdownHtml);

    // Send telemetry event for clicking copyMarkdown
    const copytoEmailEventProps: { [name: string]: string } = {
      'Title': this.renderingProperties.title,
      'ButtonClicked': 'Copy to Email'
    };
    this.logEvent(TelemetryEventNames.MarkdownClicked, copytoEmailEventProps);
  }

  openCopilot() {
    this.copilotService.selectComponentAndOpenCopilot(this.rawDiagnosticData);
  }
}
