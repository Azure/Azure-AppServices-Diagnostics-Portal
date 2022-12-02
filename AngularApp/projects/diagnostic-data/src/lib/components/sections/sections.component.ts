import { Component, OnInit } from '@angular/core';
import {
  DataTableResponseObject,
  DiagnosticData,
  SectionRendering
} from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'sections',
  templateUrl: './sections.component.html',
  styleUrls: ['./sections.component.scss']
})
export class SectionsComponent extends DataRenderBaseComponent {
  sections: SectionRendering[] = [];

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.parseData(data.table);
  }

  private parseData(table: DataTableResponseObject) {
    const titleColumn = 0;
    const dataColumn = 1;
    const isExpandColumn = 2;

    if (!table || !table.rows) return;

    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];

      const title = row[titleColumn];
      const isExpand = row[isExpandColumn].toLowerCase() === 'true';
      const diagnosticDataList = <DiagnosticData[]>JSON.parse(row[dataColumn]);

      const section = <SectionRendering>{
        title: title,
        diagnosticData: diagnosticDataList,
        isExpand: isExpand
      };

      this.sections.push(section);
    }
  }
}
