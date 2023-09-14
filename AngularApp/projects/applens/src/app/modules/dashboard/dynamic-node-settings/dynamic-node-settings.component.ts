import { Component, Input, OnInit, Output, ViewChild, ViewContainerRef, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RenderingType } from 'diagnostic-data';
import { ITextFieldProps } from 'office-ui-fabric-react';
import { GraphRenderingSettingsComponent } from '../../../../../../diagnostic-data/src/lib/graph-rendering-settings/graph-rendering-settings.component';
import { MarkdownRenderingSettingsComponent } from '../../../../../../diagnostic-data/src/lib/markdown-rendering-settings/markdown-rendering-settings.component';
import { ApplensGlobal } from '../../../applens-global';
import { InsightRenderingSettingsComponent } from '../rendering-settings-components/insight-rendering-settings/insight-rendering-settings.component';
import { RenderingSettingsBaseComponent } from '../../../../../../diagnostic-data/src/lib/components/rendering-settings-base/rendering-settings-base.component';
import { TableRenderingSettingsComponent } from '../rendering-settings-components/table-rendering-settings/table-rendering-settings.component';
import { DataSourceSettingsBase, NoCodeTableRenderingProperties, NodeSettings } from '../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { NoCodeSupportedDataSourceTypes } from '../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { KustoDataSourceSettings } from '../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { RenderingSettingsBase } from '../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { pad } from 'highcharts';

@Component({
  selector: 'dynamic-node-settings',
  templateUrl: './dynamic-node-settings.component.html',
  styleUrls: ['./dynamic-node-settings.component.scss']
})

export class DynamicNodeSettings implements OnInit {
  public readonly antaresClusterNamePlaceholderConst: string = '@AntaresStampKustoCluster';  
  public readonly antaresDatabaseNamePlaceholderConst: string = '@AnataresStampKustoDB';
  public readonly connectionStringPlaceholder: string = `${this.antaresClusterNamePlaceholderConst}/${this.antaresDatabaseNamePlaceholderConst}`;
  clusterName: string = '';
  databaseName: string = '';
  scopeString: string = "";
  @Input() dataSourceRequired: boolean = false;
  @Input() isMicrosoftWeb: boolean = false;
  datasource: DataSourceSettingsBase = new KustoDataSourceSettings;

  rendering: RenderingSettingsBase = new NoCodeTableRenderingProperties;

  settings: NodeSettings = new NodeSettings;

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
  };

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
    this.settings.dataSourceSettings = this.datasource;
    this.settings.renderingSettings = this.rendering;
  }

  updateScope(event: any){

    this.settings.dataSourceSettings.processScopeString(event.newValue);
    this.scopeString = event.newValue.toString();

    this.settings.dataSourceSettings = this.datasource;
     
    this.renderingSettingsChange.emit({instance: this.settings});
    this.settingsChangeEvent.emit({field: 'scope', oldValue: this.scopeString, newValue: event.newValue});   
  }

  updateCluster(event: any){
    this.clusterName = event.newValue;
    var oldScope = this.scopeString;
    this.scopeString = this.databaseName ? `${this.clusterName}/${this.databaseName}` : this.clusterName;

    this.settings.dataSourceSettings.processScopeString(this.scopeString);

    this.settings.dataSourceSettings = this.datasource;
     
    this.renderingSettingsChange.emit({instance: this.settings});
    this.settingsChangeEvent.emit({field: 'scope', oldValue: oldScope, newValue: event.newValue});  
  }

  updateDatabase(event: any){
    this.databaseName = event.newValue;
    var oldScope = this.scopeString;
    this.scopeString = `${this.clusterName}/${this.databaseName}`;

    this.settings.dataSourceSettings.processScopeString(this.scopeString);

    this.settings.dataSourceSettings = this.datasource;
     
    this.renderingSettingsChange.emit({instance: this.settings});
    this.settingsChangeEvent.emit({field: 'scope', oldValue: oldScope, newValue: event.newValue});  
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