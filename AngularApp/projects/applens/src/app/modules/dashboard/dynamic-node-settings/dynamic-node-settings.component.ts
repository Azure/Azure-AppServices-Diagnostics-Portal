import { Component, Input, OnInit, Output, ViewChild, ViewContainerRef, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RenderingType } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';
import { InsightRenderingSettingsComponent } from '../rendering-settings-components/insight-rendering-settings/insight-rendering-settings.component';
import { RenderingSettingsBaseComponent } from '../rendering-settings-components/rendering-settings-base/rendering-settings-base.component';
import { TableRenderingSettingsComponent } from '../rendering-settings-components/table-rendering-settings/table-rendering-settings.component';

@Component({
  selector: 'dynamic-node-settings',
  templateUrl: './dynamic-node-settings.component.html',
  styleUrls: ['./dynamic-node-settings.component.scss']
})

export class DynamicNodeSettings implements OnInit {
  clusterName: string = '@StampCluster';
  databaseName: string = 'wawsprod';

  private _instanceRef: RenderingSettingsBaseComponent = null;

  private _renderingType: RenderingType;
  @Input() set renderingType(type: RenderingType) {
    this._renderingType = type;
    this._processRenderingSettingsData();
  }
  public get renderingType(): RenderingType {
    return this._renderingType;
  }

  private _renderingSettings: any;
  @Input() set renderingSettings(settings: any) {
    this._renderingSettings = settings;
    this._processRenderingSettingsData();
  }
  public get renderingSettings(): any {
    return this._renderingSettings;
  }

  @Output() renderingSettingsChange = new EventEmitter<{field:string, instance:any}>();


  @ViewChild('dynamicRenderingSettingsContainer', { read: ViewContainerRef, static: true }) dynamicRenderingSettingsContainer: ViewContainerRef;

  constructor() {
  }

  ngOnInit() {
  }

  private _processRenderingSettingsData() {
    if(this.renderingSettings && this.renderingType) {
      const component = this._findInputComponent(this.renderingType);
      if (component == null) {
        console.error('Did not find a component for the given rendering type');
        return;
      }
      else {
        const viewContainerRef = this.dynamicRenderingSettingsContainer;
        viewContainerRef.clear();

        const componentRef = viewContainerRef.createComponent(component);
        const instance = <RenderingSettingsBaseComponent>(componentRef.instance);
        instance.renderingType = this.renderingType;
        instance.renderingSettings = this.renderingSettings;
        instance.renderingSettingsChange.subscribe((data) => {
          this.renderingSettingsChange.emit(data);
        });
        this._instanceRef = instance;
      }
    }
    else {
      console.error(`RenderingSettings:${this.renderingSettings} RenderingType: ${this.renderingType} is null`);
    }
  }

  private _findInputComponent(type: RenderingType): any {
    switch (type) {
      case RenderingType.Table:
        return TableRenderingSettingsComponent;
      case RenderingType.Insights:
        return InsightRenderingSettingsComponent;
      default:
        return null;
    }
  }

}