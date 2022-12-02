import { Component } from '@angular/core';
import {
  DiagnosticData,
  Rendering,
  RenderingType
} from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'data-summary',
  templateUrl: './data-summary.component.html',
  styleUrls: ['./data-summary.component.scss']
})
export class DataSummaryComponent extends DataRenderBaseComponent {
  DataRenderingType = RenderingType.DataSummary;

  renderingProperties: Rendering;

  public summaryViewModels: DataSummaryViewModel[] = [];

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;

    this.createViewModel();
  }

  private createViewModel() {
    if (this.diagnosticData.table.rows.length > 0) {
      const rows = this.diagnosticData.table.rows;

      const labelColumn = 0;
      const valueColumn = 1;
      const colorColumn = 2;

      rows.forEach((row) => {
        this.summaryViewModels.push(<DataSummaryViewModel>{
          name: row[labelColumn],
          value: row[valueColumn],
          color: row[colorColumn]
        });
      });
    }
  }
}

export class DataSummaryViewModel {
  value: string;
  name: string;
  color: string;
}
