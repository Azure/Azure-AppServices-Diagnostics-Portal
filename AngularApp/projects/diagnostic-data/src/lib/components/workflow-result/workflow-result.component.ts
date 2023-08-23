import { Component, Inject } from '@angular/core';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { DataTableResponseObject, DiagnosticData, Rendering } from '../../models/detector';
import { stepVariable } from '../../models/workflow';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'workflow-result',
  templateUrl: './workflow-result.component.html',
  styleUrls: ['./workflow-result.component.scss']
})
export class WorkflowResultComponent extends DataRenderBaseComponent {

  renderingProperties: Rendering;
  isPublic: boolean;
  status: string = '';
  markdown: string = '';
  variables: stepVariable[] = [];
  isInWorkflow: boolean = false;

  constructor(protected telemetryService: TelemetryService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = data.renderingProperties;
    this.parseData(data.table);
  }

  private parseData(table: DataTableResponseObject) {
    if (table.rows.length > 0) {

      let statusColIndex: number = 0;
      let markdownColIndex: number = 1;
      let variablesColIndex: number = 2;
      let isInWorkflowColIndex: number = 3;

      this.status = table.rows[0][statusColIndex];
      this.markdown = table.rows[0][markdownColIndex];
      this.variables = JSON.parse(table.rows[0][variablesColIndex]);
      this.isInWorkflow = table.rows[0][isInWorkflowColIndex];
    }
  }
}
