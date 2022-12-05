import { Injector, Type } from '@angular/core';
import { VnetIntegrationCheck } from './vnetIntegrationCheck';
import { MarkdownService } from 'ngx-markdown';
import {
  DataRenderBaseComponent,
  DynamicInsightV4Component,
  TelemetryService
} from 'diagnostic-data';
import { DiagProvider } from '../network-checks/diag-provider';

export class ComponentManager {
  private componentDict: { [name: string]: ClientScriptComponent };
  private supportedComponentTypes: Set<Type<any>>;
  constructor() {
    this.supportedComponentTypes = new Set<Type<any>>([
      DynamicInsightV4Component
    ]);
    this.componentDict = {
      VnetIntegrationCheck: new VnetIntegrationCheck()
    };
  }

  public tryGetComponent(name: string): ClientScriptComponent {
    if (this.componentDict[name] != undefined) {
      return this.componentDict[name];
    } else {
      throw new Error(`client script component ${name} not found`);
    }
  }

  public copyComponentContent(type: Type<any>, target: any, source: any) {
    if (this.supportedComponentTypes.has(type)) {
      if (type == DynamicInsightV4Component) {
        var t = <DynamicInsightV4Component>target;
        var s = <DynamicInsightV4Component>source;
        t.insight = s.insight;
      }
    } else {
      throw new Error(`${type} type is not supported`);
    }
  }
}

export interface ClientScriptComponent {
  description?: string;
  uiComponent: Type<any>;
  func(injector: Injector): Promise<DataRenderBaseComponent>;
}
