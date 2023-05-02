import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RenderingType } from 'diagnostic-data';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../../applens-global';

@Component({
  selector: 'rendering-settings-base',
  templateUrl: './rendering-settings-base.component.html',
  styleUrls: ['./rendering-settings-base.component.scss']
})

export class RenderingSettingsBaseComponent {
  _setings:any
  @Input() renderingType: RenderingType;
  @Input() set renderingSettings(settings: any) {
    this.processData(settings);
  }

  @Output() settingsChangeEvent = new EventEmitter<{field:string, oldValue:any, newValue: any}>();
  @Output() renderingSettingsChange = new EventEmitter<{instance:any}>();
  
  constructor() {
  }

  protected processData(settings: any) {
    this._setings = settings;
  }

  
}