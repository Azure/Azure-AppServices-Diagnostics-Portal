import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../../applens-global';
import { RenderingSettingsBaseComponent } from '../rendering-settings-base/rendering-settings-base.component';

@Component({
  selector: 'table-rendering-settings',
  templateUrl: './table-rendering-settings.component.html',
  styleUrls: ['./table-rendering-settings.component.scss']
})

export class TableRenderingSettingsComponent extends RenderingSettingsBaseComponent {

  constructor() {
    super();
  }
  
  protected processData(settings: any) {
    super.processData(settings);
  }
}