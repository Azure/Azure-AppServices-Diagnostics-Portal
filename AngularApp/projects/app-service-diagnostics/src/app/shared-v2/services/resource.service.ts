
import {of,  Observable, BehaviorSubject } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { ArmResource } from '../models/arm';
import { ArmService } from '../../shared/services/arm.service';
import { ArmResourceConfig } from '../../shared/models/arm/armResourceConfig';
import { GenericArmConfigService } from '../../shared/services/generic-arm-config.service';
import { PortalReferrerMap } from '../../shared/models/portal-referrer-map';
import { ResourceDescriptor, ResourceDescriptorGroups } from 'diagnostic-data';

@Injectable({providedIn: 'root'})
export class ResourceService {

  protected _subscription: string;

  public resource: ArmResource;

  public warmUpCallFinished: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  public error: any;

  constructor(protected _armService: ArmService, private _genericArmConfigService?: GenericArmConfigService) { }

  private _initialize() {
    const pieces = this.resource.id.toLowerCase().split('/');
    this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
  }

  public get resourceIdForRouting() {
    return this.resource.id.toLowerCase();
  }

  public get armResourceConfig(): ArmResourceConfig {
    if (this._genericArmConfigService) {
      return this._genericArmConfigService.getArmResourceConfig(this.resource.id);
    }
    else {
      return null;
    }
  }

  public getIbizaBladeToDetectorMapings():Observable<PortalReferrerMap[]> {
    return of(null);
  }

  public getPesId(): Observable<string>{
    if (this.armResourceConfig){
      return of(this.armResourceConfig.pesId);
    }
    return of(null);
  }

  public getKeystoneDetectorId(): Observable<string>{
      if (this.armResourceConfig) {
          return of(this.armResourceConfig.keystoneDetectorId);
      }
      return of(null);
  }

  public isGenieDisabled(): boolean{
    if (this.armResourceConfig) {
        return this.armResourceConfig.disableGenie;
    }
    return false;
}

  public get searchSuffix(): string {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if (currConfig.searchSuffix) {
        return currConfig.searchSuffix;
      }
      else {
        return 'Azure';
      }
    }
    else {
      return 'Azure';
    }
  }

  public get azureServiceName(): string {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if (currConfig.azureServiceName) {
        return currConfig.azureServiceName;
      }
      else {
        return '';
      }
    }
    else {
      return '';
    }
  }

  public get subscriptionId(): string {
    return this._subscription;
  }

  public get isLiabilityCheckEnabled(): boolean {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if (currConfig.liabilityCheckConfig && typeof currConfig.liabilityCheckConfig.isLiabilityCheckEnabled == 'boolean') {
        return currConfig.liabilityCheckConfig.isLiabilityCheckEnabled;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  public get isArmApiResponseBase64Encoded():boolean {
    if (this._genericArmConfigService) {
      return this._genericArmConfigService.isArmApiResponseBase64Encoded(this.resource.id);
    }
    else {
      return false;
    }
  }

  public get isApplicableForLiveChat(): boolean {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if ( currConfig.liveChatConfig && typeof currConfig.liveChatConfig.isApplicableForLiveChat == 'boolean') {
        return currConfig.liveChatConfig.isApplicableForLiveChat;
      }
      else {
        return false;
      }
    }
    else {
      return false;
    }
  }

  public get liveChatEnabledSupportTopicIds():string[] {
    if(this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(this.resource.id);
      if(this.isApplicableForLiveChat === true) {
        if ( currConfig.liveChatConfig && currConfig.liveChatConfig.supportTopicIds
          &&  currConfig.liveChatConfig.supportTopicIds instanceof Array
          && currConfig.liveChatConfig.supportTopicIds.length > 0 ) {
          return currConfig.liveChatConfig.supportTopicIds;
        }
        else {
          return [];
        }
      }
      else {
        return [];
      }
    }
  }

  public registerResource(resourceUri: string): Observable<{} | ArmResource> {
    if (this._genericArmConfigService && resourceUri.indexOf('hostingenvironments') < 0) {
      return this._genericArmConfigService.initArmConfig(resourceUri).pipe(
        flatMap(value => {
          return this._armService.getArmResource<ArmResource>(resourceUri).pipe(
            map(resource => {
              this.resource = resource;
              this._initialize();
              this.makeWarmUpCalls();
              return resource;
            }));
        })
      );
    }
    else {
      return this._armService.getArmResource<ArmResource>(resourceUri).pipe(
        map(resource => {
          this.resource = resource;
          this._initialize();
          this.makeWarmUpCalls();
          return resource;
        }));
    }
  }

  protected makeWarmUpCalls() {
    //No warm up calls in base
  }
}
