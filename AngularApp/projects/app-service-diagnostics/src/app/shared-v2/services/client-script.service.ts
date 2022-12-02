import { Injectable, Injector, ViewContainerRef } from '@angular/core';
import {
  DataRenderBaseComponent,
  DiagnosticData,
  TelemetryService
} from 'diagnostic-data';
import { MarkdownService } from 'ngx-markdown';
import { Globals } from '../../globals';
import { ComponentManager } from '../../shared/components/tools/client-script-components/component-manager';
import { DiagProvider } from '../../shared/components/tools/network-checks/diag-provider';
import { ArmService } from '../../shared/services/arm.service';
import { SiteService } from '../../shared/services/site.service';
import { PortalService } from '../../startup/services/portal.service';

@Injectable()
export class ClientScriptService {
  private componentManager: ComponentManager;
  private diagProvider: DiagProvider;
  constructor(
    private _injector: Injector,
    private _telemetryService: TelemetryService
  ) {
    this.componentManager = new ComponentManager();
  }

  public process(viewContainerRef: ViewContainerRef, data: DiagnosticData) {
    viewContainerRef.clear();
    try {
      var componentName: string = data.table.rows[0][0];
      var component = this.componentManager.tryGetComponent(componentName);
      const componentRef = viewContainerRef.createComponent(
        component.uiComponent
      );

      if (component.func != null) {
        component
          .func(this._injector)
          .then((result) => {
            this.componentManager.copyComponentContent(
              component.uiComponent,
              componentRef.instance,
              result
            );
          })
          .catch((error) => {
            this._telemetryService.logException(
              error,
              `ClientScriptComponent.${componentName}`
            );
          });
      }
    } catch (e) {
      this._telemetryService.logException(e, 'ClientScriptService.process');
    }
  }
}
