import { Component } from '@angular/core';
import { IDropdownOption, IDropdownProps } from 'office-ui-fabric-react';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { Rendering, DiagnosticData, DataTableResponseObject } from '../../models/detector';
import { JsonUtilities } from '../../utilities/json-utilities';

enum DropdownType {
  Legacy,
  Fabric
}

enum DropdownPosition {
  FloatLeft,
  FloatRight
}
@Component({
  selector: 'dropdown-v4',
  templateUrl: './dropdown-v4.component.html',
  styleUrls: ['./dropdown-v4.component.scss']
})
export class DropdownV4Component extends DataRenderBaseComponent {


  renderingProperties: Rendering;
  label: string;
  selectedKey: string;
  selectedData: DiagnosticData[];
  keys: string[];
  options: IDropdownOption[] = [];
  dropdownPostion: DropdownPosition = DropdownPosition.FloatRight;
  dropdownType: DropdownType = DropdownType.Legacy;
  fabDropdownWidth: number;
  Type = DropdownType;
  Position = DropdownPosition;
  styles:IDropdownProps['styles'] = {
    label: {float : "left"},
    root: {width : "250px"}
  };
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
    const dropdownTypeColumn = 4;
    const dropdownPosColumn = 5;

    this.keyDataMapping = new Map<string, DiagnosticData[]>();

    for (let i: number = 0; i < table.rows.length; i++) {

      const row = table.rows[i];
      this.label = row[labelColumn] ? row[labelColumn] : "";
      const key: string = row[keyColumn];
      const selected: boolean = row[selectedColumn];
      const data: string = row[valueColumn];
      

      let diagnosticDataList: DiagnosticData[] = JsonUtilities.parseData(data);
      diagnosticDataList = diagnosticDataList ? diagnosticDataList : [];

      const dropdownTypeStr: string = row[dropdownTypeColumn];
      this.dropdownType = DropdownType[dropdownTypeStr];

      const dropdownPosStr: string = row[dropdownPosColumn];
      this.dropdownPostion = DropdownPosition[dropdownPosStr];

      this.keyDataMapping.set(key, diagnosticDataList);

      if (selected === true) {
        this.selectedKey = key;
        this.selectedData = diagnosticDataList;
      }
    }

    this.keys = Array.from(this.keyDataMapping.keys());

    this.keys.forEach(k => {
      this.options.push({ key: k, text: k });
    });
    this.fabDropdownWidth = this.calculateFabWidth(this.options);
  }

  selectKey(key: string,event:any) {
    this.selectedKey = key;
    this.selectedData = this.keyDataMapping.get(this.selectedKey);
    this.logEvent('DropdownSelected',{
      'title':this.selectedKey
    });
    event.preventDefault();
  }

  selectFabricKey(key: { option: IDropdownOption }) {
    this.selectedKey = key.option.text;
    this.selectedData = this.keyDataMapping.get(this.selectedKey);
    this.logEvent('DropdownSelected',{
      'title':this.selectedKey
    });
  }

  calculateFabWidth(options: IDropdownOption[]): number {
    //each char 10px  
    let length = 0;
    options.forEach(option => {
      if(option && option.text && option.text.length){
        length = Math.max(length, option.text.length);
      }
    });
    let labelLength = 0;
    if(this.label && this.label.length > 0) {
      labelLength = this.label.length;
    } 
    return (length + labelLength) * 11 ;
  }
}
