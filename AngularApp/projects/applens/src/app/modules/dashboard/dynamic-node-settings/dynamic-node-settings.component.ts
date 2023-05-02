import { Component, Input, OnInit, Output, ViewChild, ViewContainerRef, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RenderingType } from 'diagnostic-data';
import { ITextFieldProps } from 'office-ui-fabric-react';
import { GraphRenderingSettingsComponent } from 'projects/diagnostic-data/src/lib/graph-rendering-settings/graph-rendering-settings.component';
import { MarkdownRenderingSettingsComponent } from 'projects/diagnostic-data/src/lib/markdown-rendering-settings/markdown-rendering-settings.component';
import { ApplensGlobal } from '../../../applens-global';
import { InsightRenderingSettingsComponent } from '../rendering-settings-components/insight-rendering-settings/insight-rendering-settings.component';
import { RenderingSettingsBaseComponent } from '../rendering-settings-components/rendering-settings-base/rendering-settings-base.component';
import { TableRenderingSettingsComponent } from '../rendering-settings-components/table-rendering-settings/table-rendering-settings.component';
import { NodeSettings, testDatasettings } from './node-rendering-json-models';
import { NoCodeSupportedDataSourceTypes } from './node-rendering-json-models';
import { KustoDataSourceSettings } from './node-rendering-json-models';
import { RenderingSettingsBase } from './node-rendering-json-models';

@Component({
  selector: 'dynamic-node-settings',
  templateUrl: './dynamic-node-settings.component.html',
  styleUrls: ['./dynamic-node-settings.component.scss']
})

export class DynamicNodeSettings implements OnInit {
  clusterName: string = '@StampCluster';
  databaseName: string = 'wawsprod';
  scopeString: string = "";
  //dataSourceType: NoCodeSupportedDataSourceTypes = NoCodeSupportedDataSourceTypes.Kusto
  // dataSource: KustoDataSourceSettings = {
  //   clusterName: this.clusterName,
  //   dataBaseName: this.databaseName,
  //   getConnectionString: function (): string {
  //     throw new Error('Function not implemented.');
  //   },
  //   GetJson: function (): string {
  //     throw new Error('Function not implemented.');
  //   },
  //   dataSourceType: NoCodeSupportedDataSourceTypes.Kusto
  // }
  datasource: KustoDataSourceSettings = new KustoDataSourceSettings;

  rendering: RenderingSettingsBase = {
    renderingType: RenderingType.Table,
    isVisible: true
  }

  settings: NodeSettings = {
    dataSourceSettings: this.datasource,
    renderingSettings: this.rendering,
    GetJson: function (): string {
      throw new Error('Function not implemented.');
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

  @Output() renderingSettingsChange = new EventEmitter<{instance:any}>();
  @Output() settingsChangeEvent = new EventEmitter<{field:string, oldValue:any, newValue: any}>();


  @ViewChild('dynamicRenderingSettingsContainer', { read: ViewContainerRef, static: true }) dynamicRenderingSettingsContainer: ViewContainerRef;

  constructor() {
  }

  ngOnInit() {
  }

  updateScope(event: any){
    //(this.settings.dataSourceSettings as testDatasettings).connectionString = event.newValue;
    // if (event.newValue.includes('/')){
    //   let connection = event.newValue.split('/');

    //   this.datasource_.clusterName = connection[0];
    //   this.datasource_.dataBaseName = connection[1]; 
    // }
    // else {
    //   this.datasource_.dataBaseName = event.newValue;
    // }

    this.settings.dataSourceSettings.processScopeString(event.newValue);

    this.settings.dataSourceSettings = this.datasource;
     
    this.renderingSettingsChange.emit({instance: this.settings});
    this.settingsChangeEvent.emit({field: 'scope', oldValue: this.scopeString, newValue: event.newValue});   
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
          this.settings.renderingSettings = data.instance;
          this.renderingSettingsChange.emit({instance: this.settings});
        });
        instance.settingsChangeEvent.subscribe((data) => {
          this.settingsChangeEvent.emit(data);
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
      case RenderingType.TimeSeries:
         return GraphRenderingSettingsComponent;
      case RenderingType.Markdown:
        return MarkdownRenderingSettingsComponent;
      default:
        return null;
    }
  }

}