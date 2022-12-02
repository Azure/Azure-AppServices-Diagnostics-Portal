import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Communication } from 'diagnostic-data';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';

@Injectable()
export class ApplensCommsService {
  constructor(
    private _diagnosticApi: DiagnosticApiService,
    private _resourceService: ResourceService
  ) {}

  public getServiceHealthCommunications(): Observable<Communication[]> {
    return this._diagnosticApi.get<Communication[]>(
      `api/comms/${this._resourceService.ArmResource.subscriptionId}?impactedService=${this._resourceService.azureCommImpactedServicesList}&checkForEmergingIssues=${this._resourceService.emergingIssuesICMLookupEnabled}`
    );
  }

  public openMoreDetails() {}
}
