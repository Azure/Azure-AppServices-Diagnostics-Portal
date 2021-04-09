import { Component } from '@angular/core';
import { DiagnosticData, DataTableRendering, TableColumnOption, DataTableResponseObject } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { TelemetryService } from '../../services/telemetry/telemetry.service';


@Component({
  selector: 'data-table-v4',
  templateUrl: './data-table-v4.component.html',
  styleUrls: ['./data-table-v4.component.scss']
})
export class DataTableV4Component extends DataRenderBaseComponent {
  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }
  
  renderingProperties: DataTableRendering;
  table:DataTableResponseObject;
  columnOptions: TableColumnOption[] = [];
  descriptionColumnName: string = "";
  allowColumnSearch: boolean = false;
  tableHeight: string = "";
  tableDescription: string = "";

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DataTableRendering>data.renderingProperties;
    this.table = this.diagnosticData.table;
    this.columnOptions = this.renderingProperties.columnOptions || [];
    this.descriptionColumnName = this.renderingProperties.descriptionColumnName || "";
    this.allowColumnSearch = this.renderingProperties.allowColumnSearch;
    this.tableHeight = this.renderingProperties.height || "";
    this.tableDescription = this.renderingProperties.description || "";
  }

  isMarkdown(s: any) {
    let str = `${s}`;
    str = str.trim();
    return str.startsWith('<markdown>') && str.endsWith('</markdown>');
  }
}


