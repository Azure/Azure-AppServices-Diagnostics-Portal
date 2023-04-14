import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ITextFieldProps } from 'office-ui-fabric-react';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../../applens-global';
import { RenderingSettingsBaseComponent } from '../rendering-settings-base/rendering-settings-base.component';

@Component({
  selector: 'table-rendering-settings',
  templateUrl: './table-rendering-settings.component.html',
  styleUrls: ['./table-rendering-settings.component.scss']
})

export class TableRenderingSettingsComponent extends RenderingSettingsBaseComponent {
  title: string = "";
  desc: string = "";

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
  
  protected processData(settings: any) {
    super.processData(settings);
  }
}