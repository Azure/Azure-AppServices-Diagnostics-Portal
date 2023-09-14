import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplensGlobal } from '../../../../applens-global';
import { RenderingSettingsBaseComponent } from '../../../../../../../diagnostic-data/src/lib/components/rendering-settings-base/rendering-settings-base.component';
import { NoCodeInsightRenderingProperties } from '../../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { RenderingType } from 'diagnostic-data';
import { ICheckboxProps } from 'office-ui-fabric-react';

@Component({
  selector: 'insight-rendering-settings',
  templateUrl: './insight-rendering-settings.component.html',
  styleUrls: ['./insight-rendering-settings.component.scss']
})

export class InsightRenderingSettingsComponent extends RenderingSettingsBaseComponent {
  expandedByDefault: boolean = false;

  renderingProperties: NoCodeInsightRenderingProperties = new NoCodeInsightRenderingProperties;

  constructor() {
    super();
  }

  updateIsExpanded(event: any){
    this.renderingProperties.isExpanded = event.checked;
    this.settingsChangeEvent.emit({field: 'expandedByDefault', oldValue: this.expandedByDefault, newValue: event.checked});
    this.renderingSettingsChange.emit({instance: this.renderingProperties});
  }

  protected processData(settings: any) {
    super.processData(settings);
  }

  
}