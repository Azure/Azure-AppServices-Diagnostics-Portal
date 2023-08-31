import { Component } from '@angular/core';
import { DiagnosticData, Rendering, RenderingType } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { GenericDetectorCopilotService } from '../../services/generic-detector-copilot.service';

@Component({
  selector: 'data-summary',
  templateUrl: './data-summary.component.html',
  styleUrls: ['./data-summary.component.scss']
})
export class DataSummaryComponent extends DataRenderBaseComponent {

  DataRenderingType = RenderingType.DataSummary;
  renderingProperties: Rendering;
  summaryViewModels: DataSummaryViewModel[] = [];
  rawDiagnosticData: DiagnosticData;
  additionalOptionsToShow: any[] = [];

  constructor(protected telemetryService: TelemetryService, private copilotService: GenericDetectorCopilotService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {

    this.rawDiagnosticData = data;
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;

    this.createViewModel();

    this.copilotService.isEnabled().subscribe(res => {
      if (res == true) {
        this.additionalOptionsToShow.push({
          iconName: 'robot',
          label: 'Ask Detector Copilot',
          onClick: this.openCopilot
        });
      }
    });
  }

  private createViewModel() {
    if (this.diagnosticData.table.rows.length > 0) {
      const rows = this.diagnosticData.table.rows;

      const labelColumn = 0;
      const valueColumn = 1;
      const colorColumn = 2;

      rows.forEach(row => {
        this.summaryViewModels.push(<DataSummaryViewModel>{ name: row[labelColumn], value: row[valueColumn], color: row[colorColumn] });
      });
    }
  }

  openCopilot = (): void => {

    let data: DiagnosticData = {
      table: this.rawDiagnosticData.table,
      renderingProperties: this.rawDiagnosticData.renderingProperties
    };

    this.copilotService.selectComponentAndOpenCopilot(data);
  }
}

export class DataSummaryViewModel {
  value: string;
  name: string;
  color: string;
}
