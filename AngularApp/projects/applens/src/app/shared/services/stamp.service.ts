import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import {
  RESOURCE_SERVICE_INPUTS,
  ResourceInfo,
  ResourceServiceInputs
} from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { HttpResponse } from '@angular/common/http';
import { DiagnosticApiService } from './diagnostic-api.service';
import { DetectorControlService } from 'diagnostic-data';
import { ObserverStampInfo, ObserverStampResponse } from '../models/observer';

@Injectable()
export class StampService extends ResourceService {
  private _currentResource: BehaviorSubject<ObserverStampInfo> =
    new BehaviorSubject(null);

  private _stampObject: ObserverStampInfo;

  constructor(
    @Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs,
    protected _observerApiService: ObserverService,
    protected _diagnosticApiService: DiagnosticApiService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService
      .getStamp(this._armResource.resourceName)
      .pipe(
        map((observerResponse: ObserverStampResponse) => {
          this._observerResource = this._stampObject =
            this.getStampInfoFromObserverResponse(observerResponse);
          this._currentResource.next(this._stampObject);
          return new ResourceInfo(
            this.getResourceName(),
            this.imgSrc,
            this.displayName,
            this.getCurrentResourceId()
          );
        })
      );
  }

  public getCurrentResource(): Observable<any> {
    return this._currentResource;
  }

  public getCurrentResourceId(forDiagApi?: boolean): string {
    return `infrastructure/stamps/${this._armResource.resourceName}`;
  }

  public getAdditionalResourceInfo(stampResource) {
    return this._diagnosticApiService
      .getKustoClusterForGeoRegion(stampResource.GeoLocation)
      .pipe(
        map((kustoClusterRes) => {
          let clusterName = null;
          if (kustoClusterRes) {
            clusterName =
              kustoClusterRes.ClusterName || kustoClusterRes.clusterName;
          }

          let stampName = stampResource.Name;
          let monikerName = stampName.replace('-', '').toUpperCase();
          let st = this._detectorControlService.startTime.unix() * 1000;
          let et = this._detectorControlService.endTime.unix() * 1000;
          let jarvisLink = `https://portal.microsoftgeneva.com/s/92FB14BA?overrides=[{%22query%22:%22//*[id='moniker']%22,%22key%22:%22value%22,%22replacement%22:%22${monikerName}%22},{%22query%22:%22//*[id='Stamp']%22,%22key%22:%22value%22,%22replacement%22:%22${stampName}%22},{%22query%22:%22//*[id='cluster']%22,%22key%22:%22value%22,%22replacement%22:%22${clusterName}%22}]&globalStartTime=${st}&globalEndTime=${et}&pinGlobalTimeRange=true`;
          let jarvisDashboardLink = `<a href="${jarvisLink}" target="_blank">${stampName}</a>`;

          clusterName = clusterName || 'N/A';
          return {
            JarvisDashboard: jarvisDashboardLink,
            KustoCluster: clusterName
          };
        }),
        catchError((err) => {
          return of({});
        })
      );
  }

  private getStampInfoFromObserverResponse(
    observerResponse: ObserverStampResponse
  ): ObserverStampInfo {
    return {
      Name: observerResponse.details.prod_environment.name,
      SubscriptionId: observerResponse.details.prod_environment.subscription_id,
      StampType: observerResponse.details.prod_environment.dns.includes(
        'cloudapp.azure.com'
      )
        ? 'CloudService'
        : 'VMSS',
      DNS: observerResponse.details.prod_environment.dns,
      VIP: observerResponse.details.prod_environment.vip,
      DeploymentId: observerResponse.details.prod_environment.deployment_id,
      Cluster: observerResponse.details.prod_environment.cluster,
      IsFlexStamp: observerResponse.details.is_flex_stamp,
      GeoLocation: observerResponse.details.geo_location
    };
  }
}
