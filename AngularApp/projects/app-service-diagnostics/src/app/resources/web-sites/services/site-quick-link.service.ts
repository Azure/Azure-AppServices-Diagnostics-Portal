import { Injectable } from '@angular/core';
import { QuickLinkService } from '../../../shared-v2/services/quick-link.service';
import { AppType } from '../../../shared/models/portal';
import { Sku } from '../../../shared/models/server-farm';
import {
  HostingEnvironmentKind,
  OperatingSystem
} from '../../../shared/models/site';
import { SiteFilteredItem } from '../models/site-filter';
import { WebSiteFilter } from '../pipes/site-filter.pipe';

@Injectable({ providedIn: 'root' })
export class SiteQuickLinkService extends QuickLinkService {
  constructor(private _websiteFilter: WebSiteFilter) {
    super();
    const quickLinks = this._websiteFilter.transform(this._siteQuickLinks);
    let links: string[] = [];
    for (const quickLink of quickLinks) {
      links = links.concat(quickLink);
    }
    this._addQuickLinks(links);
  }

  private _siteQuickLinks: SiteFilteredItem<string[]>[] = [
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: ['appDownAnalysis', 'perfAnalysis', 'webappcpu', 'networkchecks']
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: [
        'LinuxLogViewer',
        'LinuxAppDown',
        'LinuxAppSlow',
        'LinuxProcessFullList'
      ]
    },
    {
      appType: AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: [
        'functionappdownanderrors',
        'functionsettings',
        'BestPracticesFunctionApp',
        'networkchecks'
      ]
    }
  ];
}
