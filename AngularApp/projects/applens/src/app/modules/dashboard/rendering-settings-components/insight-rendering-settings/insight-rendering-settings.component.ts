import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../../applens-global';
import { RenderingSettingsBaseComponent } from '../rendering-settings-base/rendering-settings-base.component';

@Component({
  selector: 'insight-rendering-settings',
  templateUrl: './insight-rendering-settings.component.html',
  styleUrls: ['./insight-rendering-settings.component.scss']
})

export class InsightRenderingSettingsComponent extends RenderingSettingsBaseComponent {
  expandedByDefault: boolean = false;

  constructor() {
    super();
  }

  protected processData(settings: any) {
    super.processData(settings);
  }

  
}