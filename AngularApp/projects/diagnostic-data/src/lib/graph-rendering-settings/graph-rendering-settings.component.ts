import { Component, OnInit } from '@angular/core';
import { RenderingType, TimeSeriesType } from 'diagnostic-data';
import { IDropdownProps, ITextFieldProps } from 'office-ui-fabric-react';
import { NoCodeGraphRenderingProperties } from 'projects/applens/src/app/modules/dashboard/dynamic-node-settings/node-rendering-json-models';
import { RenderingSettingsBaseComponent } from 'projects/applens/src/app/modules/dashboard/rendering-settings-components/rendering-settings-base/rendering-settings-base.component';

@Component({
  selector: 'graph-rendering-settings',
  templateUrl: './graph-rendering-settings.component.html',
  styleUrls: ['./graph-rendering-settings.component.scss']
})
export class GraphRenderingSettingsComponent extends RenderingSettingsBaseComponent implements OnInit {
  title: string = "";
  desc: string = "";
  selectedType: string = 'line';

  renderingProperties: NoCodeGraphRenderingProperties = {
    renderingType: RenderingType.TimeSeries,
    isVisible: true
  }

  graphTypeOptions: IDropdownProps['options'] = [
    {key: 'line', text: 'line'},
    {key: 'bar', text: 'bar'},
    {key: 'stack', text: 'stack'}
  ];

  dropdownStyle: IDropdownProps['styles'] = {
    root: {
      display: "flex"
    },
    label: {
      marginRight: "10px",
      width: "fit-content"
    },
    dropdown: {
      width: "fit-content"
    }
  }

  textBoxStyle: ITextFieldProps['styles'] = {
    root: {
      display: "flex"
    },
    wrapper: {
      display: "flex"
    },
    fieldGroup: {
      marginLeft: "10px"
    }
  }

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

  updateTitle(event: any){
    this.renderingProperties.title = event.newValue == '' ? null : event.newValue;
    this.settingsChangeEvent.emit({field: 'title', oldValue: this.title, newValue: event.newValue});
    this.renderingSettingsChange.emit({instance: this.renderingProperties});
  }

  updateDesc(event: any){
    this.renderingProperties.description = event.newValue == '' ? null : event.newValue;
    this.settingsChangeEvent.emit({field: 'desc', oldValue: this.desc, newValue: event.newValue});
    this.renderingSettingsChange.emit({instance: this.renderingProperties});
  }

  updateType(event: any){
    let newType = this.getGraphType(event.option.key)
    this.renderingProperties.graphType = event.option.key == '' ? null : newType;
    this.settingsChangeEvent.emit({field: 'graph type', oldValue: this.selectedType, newValue: newType});
    this.renderingSettingsChange.emit({instance: this.renderingProperties});
  }

  getGraphType(type: string){
    switch (type) {
      case 'line':
        return TimeSeriesType.LineGraph
      case 'bar':
        return TimeSeriesType.BarGraph
      case 'stack':
        return TimeSeriesType.StackedAreaGraph
      default:
        return TimeSeriesType.LineGraph
    }
  }

  // changeType(event:any){
  //   this.selectedType = event.option.key;
  // }

}
