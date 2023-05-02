import { Component, OnInit } from '@angular/core';
import { ITextFieldProps } from 'office-ui-fabric-react';
import { NoCodeMarkdownRenderingProperties } from 'projects/applens/src/app/modules/dashboard/dynamic-node-settings/node-rendering-json-models';
import { RenderingType } from '../models/detector';
import { RenderingSettingsBaseComponent } from 'projects/applens/src/app/modules/dashboard/rendering-settings-components/rendering-settings-base/rendering-settings-base.component';

@Component({
  selector: 'markdown-rendering-settings',
  templateUrl: './markdown-rendering-settings.component.html',
  styleUrls: ['./markdown-rendering-settings.component.scss']
})
export class MarkdownRenderingSettingsComponent extends RenderingSettingsBaseComponent implements OnInit {
  // title: string = "";

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

  renderingProperties: NoCodeMarkdownRenderingProperties = {
    renderingType: RenderingType.Markdown,
    isVisible: true
  }

  // updateTitle(event: any){
  //   this.renderingProperties.title = event.newValue == '' ? null : event.newValue;
  //   this.settingsChangeEvent.emit({field: 'title', oldValue: this.title, newValue: event.newValue});
  //   this.renderingSettingsChange.emit({instance: this.renderingProperties});
  // }

  constructor() {
    super();
  }

  ngOnInit(): void {
  }

}
