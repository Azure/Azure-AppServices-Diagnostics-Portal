import { Injectable } from '@angular/core';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from '../../shared/services/arm.service';
import { Observable, pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { VersionTestService } from '../../fabric-ui/version-test.service';
@Injectable({
  providedIn: 'root'
})
export class PortalSettingsService {

  settingsUrl: string = '';
  resource: any;
  resourceId: string;
  scanEnabled: boolean = false;
  constructor(private authService: AuthService, private armService: ArmService, private versionTestService: VersionTestService) {
    this.authService.getStartupInfo().subscribe(data => {
      this.resourceId = data.resourceId;
      this.settingsUrl = `/resource${data.resourceId}/settings`;
      // This needs to be mapped to dynamic category once we expand this to other resource types.
      this.versionTestService.isLegacySub.subscribe(isLegacy => {
        this.settingsUrl = isLegacy ? `/resource${data.resourceId}/settings`:`/resource${data.resourceId}/categories/AvailabilityAndPerformanceWindows/settings`;
      });
    });
  }

  public getUrlToNavigate(): string {
    return this.settingsUrl;
  }

  public getScanEnabled(): Observable<boolean> {
    let url = this.resourceId;
    return this.armService.getResource<ResponseMessageEnvelope<any>>(url, '2018-02-01', true).pipe(map((data: ResponseMessageEnvelope<any>) => {
      let resource = data;
      let scanEnabled = false;
      if (resource.tags && resource.tags['hidden-related:diagnostics/changeAnalysisScanEnabled']) {
        scanEnabled = resource.tags['hidden-related:diagnostics/changeAnalysisScanEnabled'] == 'true' ? true : false;
      } else {
        scanEnabled = false;
      }
      return scanEnabled;
    }));
  }
}
