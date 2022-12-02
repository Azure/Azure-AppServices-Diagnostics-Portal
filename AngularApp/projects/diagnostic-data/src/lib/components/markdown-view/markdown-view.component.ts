import { Component, Inject } from '@angular/core';
import { DiagnosticData, MarkdownRendering } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { MarkdownService } from 'ngx-markdown';
import { ClipboardService } from '../../services/clipboard.service';
import {
  DIAGNOSTIC_DATA_CONFIG,
  DiagnosticDataConfig
} from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

const emailTemplate = `To:
Subject: Case Email
X-Unsent: 1
Content-Type: text/html

<!DOCTYPE html>
<html>
<body>
    {body}
</body>
</html>`;

@Component({
  selector: 'markdown-view',
  templateUrl: './markdown-view.component.html',
  styleUrls: ['./markdown-view.component.scss']
})
export class MarkdownViewComponent extends DataRenderBaseComponent {
  renderingProperties: MarkdownRendering;
  markdownData: string;
  isPublic: boolean;

  constructor(
    private _markdownService: MarkdownService,
    private _clipboard: ClipboardService,
    @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig,
    protected telemetryService: TelemetryService
  ) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <MarkdownRendering>data.renderingProperties;

    this.createViewModel();
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
      Title: this.renderingProperties.title,
      ButtonClicked: 'Copy to Email'
    };
    this.logEvent(TelemetryEventNames.MarkdownClicked, copytoEmailEventProps);
  }

  openEmail() {
    const markdownHtml = this._markdownService.compile(this.markdownData);
    const mailto = emailTemplate.replace('{body}', markdownHtml);
    const data = new Blob([mailto], { type: 'text/plain' });
    const textFile = window.URL.createObjectURL(data);

    this.download('CaseEmail.eml', textFile);

    // Send telemetry event for clicking openEmail
    const openOutlookEventProps: { [name: string]: string } = {
      Title: this.renderingProperties.title,
      ButtonClicked: 'Open in Outlook'
    };
    this.logEvent(TelemetryEventNames.MarkdownClicked, openOutlookEventProps);
  }

  download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', text);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
}
