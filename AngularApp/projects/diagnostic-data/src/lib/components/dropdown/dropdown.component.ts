import { Component } from '@angular/core';
import {
  DataTableResponseObject,
  DiagnosticData,
  Rendering
} from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'diag-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss']
})
export class DropdownComponent extends DataRenderBaseComponent {
  renderingProperties: Rendering;
  label: string;
  selectedKey: string;
  selectedData: DiagnosticData[];
  keys: string[];

  private keyDataMapping: Map<string, DiagnosticData[]>;

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = data.renderingProperties;
    this.parseData(data.table);
  }

  private parseData(table: DataTableResponseObject) {
    const labelColumn = 0;
    const keyColumn = 1;
    const selectedColumn = 2;
    const valueColumn = 3;

    this.keyDataMapping = new Map<string, DiagnosticData[]>();

    for (let i: number = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      this.label = row[labelColumn];
      const key: string = row[keyColumn];
      const selected: boolean = row[selectedColumn];
      const data: string = row[valueColumn];
      const rawJson: any = JSON.parse(data);
      const diagnosticDataList: DiagnosticData[] = <DiagnosticData[]>rawJson;

      this.keyDataMapping.set(key, diagnosticDataList);

      if (selected === true) {
        this.selectedKey = key;
        this.selectedData = diagnosticDataList;
      }
    }

    this.keys = Array.from(this.keyDataMapping.keys());
  }

  selectKey(key: string, event: any) {
    this.selectedKey = key;
    this.selectedData = this.keyDataMapping.get(this.selectedKey);
    event.preventDefault();
  }
}
