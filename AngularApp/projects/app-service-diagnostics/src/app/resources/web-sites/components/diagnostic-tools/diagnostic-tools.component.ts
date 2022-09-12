import { Component } from '@angular/core';
import { SiteFilteredItem } from '../../models/site-filter';
import { Tile } from '../../../../shared/components/tile-list/tile-list.component';
import { SiteFeatureService } from '../../services/site-feature.service';
import { WebSitesService } from '../../services/web-sites.service';
import { SiteService } from '../../../../shared/services/site.service';
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { AppType } from '../../../../shared/models/portal';
import { OperatingSystem, HostingEnvironmentKind } from '../../../../shared/models/site';
import { Sku } from '../../../../shared/models/server-farm';
import { ResourceService } from '../../../../shared-v2/services/resource.service';
import { AuthService } from '../../../../startup/services/auth.service';
import { TelemetryService } from 'diagnostic-data';


@Component({
  selector: 'diagnostic-tools',
  templateUrl: './diagnostic-tools.component.html',
  styleUrls: ['./diagnostic-tools.component.scss']
})
export class DiagnosticToolsComponent {

  toolCategories: SiteFilteredItem<any>[] = [];

  stackFound: boolean = false;
  stack: string;
  isWindowsApp: boolean = true;

  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;

  possibleStacks: string[] = [
    'ASP.NET',
    'ASP.NET Core',
    'Java',
    'PHP',
    'All'
  ];

  constructor(private _sitesFeatureService: SiteFeatureService, public webSiteService: WebSitesService, private _siteService: SiteService, private _resourceService: ResourceService, private _authServiceInstance: AuthService, private _telemetryService: TelemetryService) {

    if (this.webSiteService.platform !== OperatingSystem.windows) {
      this.isWindowsApp = false;
    } else {
      this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
        this.siteToBeDiagnosed = site;
      });
    }

    this.scmPath = this.webSiteService.resource.properties.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp | AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      sku: Sku.NotDynamic,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      stack: '',
      item: {
        title: 'Proactive Tools',
        tools: this._sitesFeatureService.proactiveTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            hostingEnvironmentKind: tool.hostingEnvironmentKind,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      stack: '',
      item: {
        title: 'Diagnostic Tools',
        tools: this._sitesFeatureService.diagnosticTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            hostingEnvironmentKind: tool.hostingEnvironmentKind,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      stack: '',
      item: {
        title: 'Diagnostic Tools',
        tools: this._sitesFeatureService.diagnosticTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            hostingEnvironmentKind: tool.hostingEnvironmentKind,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      sku: Sku.NotDynamic,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      stack: '',
      item: {
        title: 'Support Tools',
        tools: this._sitesFeatureService.supportTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            hostingEnvironmentKind: tool.hostingEnvironmentKind,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    if (this.webSiteService.appStack && this.webSiteService.appStack != '') {
      this.selectStack(this.webSiteService.appStack);
    }

    this._authServiceInstance.getStartupInfo().subscribe(startUpInfo => {
      if (startUpInfo) {
        const resourceId = startUpInfo.resourceId ? startUpInfo.resourceId : '';
        const ticketBladeWorkflowId = startUpInfo.workflowId ? startUpInfo.workflowId : '';
        const supportTopicId = startUpInfo.supportTopicId ? startUpInfo.supportTopicId : '';
        const sapSupportTopicId = startUpInfo.sapSupportTopicId ? startUpInfo.sapSupportTopicId : '';
        const sessionId = startUpInfo.sessionId ? startUpInfo.sessionId : '';

        const eventProperties: { [name: string]: string } = {
          'ResourceId': resourceId,
          'TicketBladeWorkflowId': ticketBladeWorkflowId,
          'SupportTopicId': supportTopicId,
          'SapSupportTopicId': sapSupportTopicId,
          'PortalSessionId': sessionId,
          'AzureServiceName': this._resourceService.azureServiceName,
        };
        this._telemetryService.eventPropertiesSubject.next(eventProperties);
      }
    });
  }

  selectStack(stack: string) {
    this.stack = this.possibleStacks.find(st => st.toLowerCase() === stack.toLowerCase());

    if (!stack) {
      this.stackFound = false;
      this.stack = 'All';
    } else {
      this.stackFound = true;
    }
  }
}
