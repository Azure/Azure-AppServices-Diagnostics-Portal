import { Injectable, Host } from '@angular/core';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { StartupInfo, ResourceType } from '../models/portal';
import { BehaviorSubject } from 'rxjs';
import {
  HostingEnvironment,
  AseInfoMetaData
} from '../models/hostingEnvironment';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';

@Injectable()
export class AseService {
  public currentAseSubject: BehaviorSubject<HostingEnvironment> =
    new BehaviorSubject<HostingEnvironment>(null);
  public currentAseMetaDataSubject: BehaviorSubject<AseInfoMetaData> =
    new BehaviorSubject<AseInfoMetaData>(null);

  public currentAse: HostingEnvironment;
  public currentAseMetaData: AseInfoMetaData;

  constructor(
    private _armClient: ArmService,
    private _authService: AuthService
  ) {
    this._authService.getStartupInfo().subscribe((startUpInfo: StartupInfo) => {
      this._populateAseInfo(startUpInfo.resourceId);
      if (startUpInfo.resourceType === ResourceType.HostingEnvironment) {
        this._armClient
          .getResource<HostingEnvironment>(startUpInfo.resourceId)
          .subscribe((site: ResponseMessageEnvelope<HostingEnvironment>) => {
            this.currentAse = site.properties;
            this.currentAseSubject.next(this.currentAse);
          });
      }
    });
  }

  private _populateAseInfo(resourceId: string): void {
    const pieces = resourceId.toLowerCase().split('/');

    this.currentAseMetaData = <AseInfoMetaData>{
      resourceUri: resourceId,
      subscriptionId: pieces[pieces.indexOf('subscriptions') + 1],
      resourceGroupName: pieces[pieces.indexOf('resourcegroups') + 1],
      name: pieces[pieces.indexOf('hostingenvironments') + 1]
    };

    this.currentAseMetaDataSubject.next(this.currentAseMetaData);
  }
}
