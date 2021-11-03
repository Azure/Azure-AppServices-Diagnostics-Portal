import { Component } from '@angular/core';
import { Icon, IPivotItemProps } from 'office-ui-fabric-react';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { Rendering, DiagnosticData, DataTableResponseObject, TabRendering } from '../../models/detector';
import { JsonUtilities } from '../../utilities/json-utilities';

@Component({
  selector: 'fab-tab',
  templateUrl: './fab-tab.component.html',
  styleUrls: ['./fab-tab.component.scss']
})
export class FabTabComponent extends DataRenderBaseComponent {

  renderingProperties: Rendering;
  selectedKey: string;
  mappingKeys: TabRendering[];
  contentMapping: Map<string, DiagnosticData[]>;

  tabContent(key: string): DiagnosticData[] {
    const content = this.contentMapping.get(key);
    return content;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = data.renderingProperties;
    this.parseData(data.table);
  }

  private parseData(table: DataTableResponseObject) {
    const labelColumn = 0;
    const iconColumn = 1;
    const showItemColumn = 2;
    const itemCountValueColumn = 3;
    const valueColumn = 4;
    const needsAttentionColumn = 5;

    this.mappingKeys = new Array();
    this.contentMapping = new Map<string, DiagnosticData[]>();

    for (let i: number = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const label: string = row[labelColumn] || "";

      const tabInfoBuilder: Partial<TabRendering> = {
        title: label,
        icon: row[iconColumn],
        needsAttention: row[needsAttentionColumn],
      };

      if (row[showItemColumn]) {
        tabInfoBuilder.itemCount = row[itemCountValueColumn];
      }

      const tabInfo: TabRendering = tabInfoBuilder as TabRendering;
      const data: string = row[valueColumn];

      let diagnosticDataList: DiagnosticData[] = JsonUtilities.parseData(data);
      diagnosticDataList = diagnosticDataList ? diagnosticDataList : [];
      
      this.contentMapping.set(label, diagnosticDataList);
      this.mappingKeys.push(tabInfo);

      if (i == 0) {
        this.selectedKey = label;
      }
    }

  }

}
