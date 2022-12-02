import { Pipe, PipeTransform } from '@angular/core';
import { Sku } from '../../../shared/models/server-farm';
import { SiteFilteredItem } from '../models/site-filter';
import { WebSitesService } from '../services/web-sites.service';

@Pipe({ name: 'website' })
export class WebSiteFilter implements PipeTransform {
  constructor(private _webSiteService: WebSitesService) {}
  tempArray: any[] = [];
  transform<T>(
    siteFilteredItems: SiteFilteredItem<T>[],
    overrideStack?: string
  ): T[] {
    this.tempArray = [];
    return siteFilteredItems
      .filter(
        (item) =>
          (item.appType & this._webSiteService.appType) > 0 &&
          (item.platform & this._webSiteService.platform) > 0 &&
          (item.sku === Sku.All ||
            (item.sku === Sku.NotDynamic &&
              this._webSiteService.sku != Sku.Dynamic) ||
            item.sku & this._webSiteService.sku) > 0 &&
          (item.hostingEnvironmentKind &
            this._webSiteService.hostingEnvironmentKind) >
            0 &&
          (item.stack === '' ||
            (overrideStack &&
              (overrideStack === '' ||
                overrideStack.toLowerCase() === 'all')) ||
            item.stack
              .toLowerCase()
              .indexOf(
                overrideStack
                  ? overrideStack.toLowerCase()
                  : this._webSiteService.appStack.toLowerCase()
              ) >= 0) &&
          !this.alreadyAdded(item.item)
      )
      .map((item) => item.item);
  }

  alreadyAdded(item: any): boolean {
    if (item.title && this.tempArray.indexOf(item.title) > -1) {
      return true;
    }

    this.tempArray.push(item.title);

    return false;
  }
}
