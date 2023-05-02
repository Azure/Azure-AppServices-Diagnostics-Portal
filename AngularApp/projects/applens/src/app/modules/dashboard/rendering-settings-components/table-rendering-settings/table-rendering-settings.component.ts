import { Component, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ITextFieldProps } from 'office-ui-fabric-react';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../../applens-global';
import { RenderingSettingsBaseComponent } from '../rendering-settings-base/rendering-settings-base.component';
import { NoCodeTableRenderingProperties } from '../../dynamic-node-settings/node-rendering-json-models';
import { RenderingType } from 'diagnostic-data';

@Component({
  selector: 'table-rendering-settings',
  templateUrl: './table-rendering-settings.component.html',
  styleUrls: ['./table-rendering-settings.component.scss']
})

export class TableRenderingSettingsComponent extends RenderingSettingsBaseComponent {
  title: string = "";
  desc: string = "";

  renderingProperties: NoCodeTableRenderingProperties = {
    renderingType: RenderingType.Table,
    isVisible: true
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

  // @Output() renderingSettingsChange = new EventEmitter<{field:string, instance:any}>();

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

  constructor() {
    super();
  }
  
  protected processData(settings: any) {
    super.processData(settings);
  }
}