import { WebSitesService } from './web-sites.service';
import { Injectable } from '@angular/core';
import { SupportTopicService } from '../../../shared-v2/services/support-topic.service';
import { DiagnosticService, TelemetryService } from 'diagnostic-data';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { Observable, of } from 'rxjs';
import { OperatingSystem } from '../../../shared/models/site';
import { VersioningHelper } from '../../../shared/utilities/versioningHelper';
import { HttpClient } from '@angular/common/http';
import {AuthService} from '../../../startup/services/auth.service';
import { ArmService } from '../../../shared/services/arm.service';

@Injectable()
export class SiteSupportTopicService extends SupportTopicService {

  private _hardCodedSupportTopicIdMapping = [];

  constructor(protected _http: HttpClient, protected _authService: AuthService, protected _diagnosticService: DiagnosticService, protected _webSiteService: WebSitesService, protected _telemetryService: TelemetryService, protected _armService: ArmService) {
    super(_http, _authService, _diagnosticService, _webSiteService, _telemetryService, _armService);

    if (!VersioningHelper.isV2Subscription(_webSiteService.subscriptionId)) {

      // To enable a/b testing, uncomment the below line with the right path and Support Topic Id
      // (the below is an example of how we did the testing for CPU detector)

      //this._hardCodedSupportTopicIdMapping.push({pesId: '14748',supportTopicId: '32542218',path: '/diagnostics/availability/analysis' });
    }
  }

  getPathForSupportTopic(supportTopicId: string, pesId: string, searchTerm: string, sapSupportTopicId: string="", sapProductId: string=""): Observable<string> {
    const matchingMapping = this._hardCodedSupportTopicIdMapping.find(
      supportTopic => supportTopic.sapSupportTopicId === sapSupportTopicId &&
        (!sapProductId || sapProductId === '' || supportTopic.sapProductId === sapProductId)
    );

    if (matchingMapping && this._webSiteService.platform == OperatingSystem.windows) {
      return of(`/legacy${matchingMapping.path}`);
    } else {
      return super.getPathForSupportTopic(supportTopicId, pesId, searchTerm, sapSupportTopicId, sapProductId);
    }
  }
}
