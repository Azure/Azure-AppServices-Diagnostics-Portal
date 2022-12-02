import { mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Site } from '../models/site';
import { ServerFarm } from '../models/server-farm';
import { StartupInfo, ResourceType } from '../models/portal';

import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { BehaviorSubject } from 'rxjs';
import { ArmService } from './arm.service';
import { UriElementsService } from './urielements.service';
import { AuthService } from '../../startup/services/auth.service';
import { RBACService } from './rbac.service';

@Injectable()
export class ServerFarmDataService {
  private siteResourceId: string;

  public siteServerFarm: BehaviorSubject<ServerFarm> = new BehaviorSubject(
    null
  );
  public hasServerFarmAccess: BehaviorSubject<boolean> = new BehaviorSubject(
    null
  );
  public sitesInServerFarm: BehaviorSubject<Site[]> = new BehaviorSubject(null);

  private currentSite: Site;
  public hasReadAccessToServerFarm: boolean;

  private serverFarmBehaviorSubject: BehaviorSubject<ServerFarm> =
    new BehaviorSubject<ServerFarm>(null);

  constructor(
    private _armService: ArmService,
    private _uriElementsService: UriElementsService,
    private _authService: AuthService,
    private _rbacService: RBACService
  ) {
    this._authService.getStartupInfo().subscribe((startUpInfo: StartupInfo) => {
      if (!startUpInfo) {
        return;
      }
      this.siteResourceId = startUpInfo.resourceId;
      if (startUpInfo.resourceType === ResourceType.Site) {
        return this._armService
          .getResource<Site>(this.siteResourceId)
          .pipe(
            mergeMap((site: ResponseMessageEnvelope<Site>) => {
              this.currentSite = site.properties;
              if (!!this.currentSite.serverFarmId) {
                return this._rbacService.hasPermission(
                  this.currentSite.serverFarmId,
                  [this._rbacService.readScope]
                );
              } else {
                return this._rbacService.hasPermission(this.siteResourceId, [
                  this._rbacService.readScope
                ]);
              }
            }),
            mergeMap((hasPermission: boolean) => {
              this.hasServerFarmAccess.next(hasPermission);
              const resourceUri = !!this.currentSite.serverFarmId
                ? this.currentSite.serverFarmId
                : this.siteResourceId;
              return this._armService.getResourceWithoutEnvelope<ServerFarm>(
                resourceUri
              );
            }),
            mergeMap((serverFarm: ServerFarm) => {
              serverFarm = this.addAdditionalProperties(serverFarm);
              this.siteServerFarm.next(serverFarm);
              return this._armService.getResourceCollection<Site>(
                serverFarm.id + '/sites'
              );
            })
          )
          .subscribe((sites: ResponseMessageEnvelope<Site>[]) => {
            this.sitesInServerFarm.next(sites.map((env) => env.properties));
          });
      }
    });
  }

  public getSiteServerFarm() {
    return this.serverFarmBehaviorSubject;
  }

  private addAdditionalProperties(serverFarm: ServerFarm): ServerFarm {
    if (serverFarm) {
      const sizeId = serverFarm.sku
        ? serverFarm.sku.name.replace(serverFarm.sku.family, '')
        : '';
      switch (sizeId) {
        case '1':
          serverFarm.additionalProperties = {
            cores: 1,
            ramInGB: 1.75
          };
          break;
        case '2':
          serverFarm.additionalProperties = {
            cores: 2,
            ramInGB: 3.5
          };
          break;
        case '3':
          serverFarm.additionalProperties = {
            cores: 4,
            ramInGB: 7
          };
          break;
      }

      if (serverFarm.sku && serverFarm.sku.family.toLowerCase() === 'p1') {
        serverFarm.additionalProperties.cores *= 2;
        serverFarm.additionalProperties.ramInGB *= 2;
      }
    }

    return serverFarm;
  }
}
