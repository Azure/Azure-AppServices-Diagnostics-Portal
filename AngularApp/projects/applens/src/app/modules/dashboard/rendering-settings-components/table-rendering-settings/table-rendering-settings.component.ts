import { Component, EventEmitter, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ITextFieldProps } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../../applens-global';
import { RenderingSettingsBaseComponent } from '../../../../../../../diagnostic-data/src/lib/components/rendering-settings-base/rendering-settings-base.component';
import { NoCodeTableRenderingProperties } from '../../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { RenderingType } from 'diagnostic-data';

@Component({
  selector: 'table-rendering-settings',
  templateUrl: './table-rendering-settings.component.html',
  styleUrls: ['./table-rendering-settings.component.scss']
})

export class TableRenderingSettingsComponent extends RenderingSettingsBaseComponent {
  title: string = "";
  desc: string = "";

  renderingProperties: NoCodeTableRenderingProperties = new NoCodeTableRenderingProperties;

  textBoxStyle: ITextFieldProps['styles'] = {
    root: {
      display: "flex",
      paddingBottom: "10px",
      marginLeft: "10px"
    },
    wrapper: {
      display: "block"
    },
    field: {
      width: '312px'
    }
  }

  // @Output() renderingSettingsChange = new EventEmitter<{field:string, instance:any}>();

  updateTitle(event: any){
    this.renderingProperties.title = event.newValue == '' ? null : event.newValue;
    this.settingsChangeEvent.emit({field: 'title', oldValue: this.title, newValue: event.newValue});
    this.renderingSettingsChange.emit({instance: this.renderingProperties});
    this.title = event.newValue;
  }

  updateDesc(event: any){
    this.renderingProperties.description = event.newValue == '' ? null : event.newValue;
    this.settingsChangeEvent.emit({field: 'desc', oldValue: this.desc, newValue: event.newValue});
    this.renderingSettingsChange.emit({instance: this.renderingProperties});
    this.desc = event.newValue;
  }

  constructor() {
    super();
  }
  
  protected processData(settings: any) {
    super.processData(settings);
  }
}