import { Injectable } from '@angular/core';
import { ResourceService } from './resource.service';
import { AuthService } from '../../startup/services/auth.service';
import { LoggingService } from '../../shared/services/logging/logging.service';
import { PortalService } from '../../startup/services/portal.service';
import { ArmService } from '../../shared/services/arm.service';
import { StartupInfo } from '../../shared/models/portal';
import { V2EventType } from '../../shared/services/logging/events.enumerations';
import { HealthStatus } from 'diagnostic-data';

@Injectable()
export class LoggingV2Service extends LoggingService {
  constructor(
    private _portalService: PortalService,
    private _authService: AuthService,
    private _armService: ArmService,
    private _resourceService: ResourceService
  ) {
    super(_portalService, _authService, _armService);
  }

  LogCategorySelected(category: string) {
    this._log(V2EventType[V2EventType.CategorySelected], category, {});
  }

  LogTopLevelDetector(
    detectorId: string,
    detectorName: string,
    category: string
  ) {
    this._log(V2EventType[V2EventType.TopLevelDetectorSelected], category, {
      detectorId: detectorId,
      detectorName: detectorName
    });
  }

  LogSearch(searchValue: string) {
    this._log(V2EventType[V2EventType.Search], 'HomeV2', {
      searchValue: searchValue
    });
  }

  LogSearchSelection(
    searchValue: string,
    selectionId: string,
    selectionName: string,
    selectionType: string
  ) {
    this._log(V2EventType[V2EventType.SearchResultSelected], 'HomeV2', {
      searchValue: searchValue,
      selectionId: selectionId,
      selectionName: selectionName,
      selectionType: selectionType
    });
  }

  LogDetectorSummaryFullReportSelection(
    parentDetectorId: string,
    category: string
  ) {
    this._log(
      V2EventType[V2EventType.DetectorSummaryFullReportSelected],
      category,
      {
        parentDetectorId: parentDetectorId
      }
    );
  }

  LogDetectorSummarySelection(
    parentDetectorId: string,
    name: string,
    status: HealthStatus,
    category: string
  ) {
    this._log(V2EventType[V2EventType.DetectorSummarySelected], category, {
      parentDetectorId: parentDetectorId,
      name: name,
      status: HealthStatus[status]
    });
  }

  LogChildDetectorSelection(
    parentDetectorId: string,
    detectorId: string,
    detectorName: string,
    status: HealthStatus,
    category: string
  ) {
    this.LogDetectorSummarySelection(
      parentDetectorId,
      detectorName,
      status,
      category
    );
    this._log(
      V2EventType[V2EventType.DetectorSummaryChildDetectorSelected],
      category,
      {
        parentDetectorId: parentDetectorId,
        detectorId: detectorId,
        detectorName: detectorName,
        status: HealthStatus[status]
      }
    );
  }

  LogDetectorSummaryInsightSelection(
    parentDetectorId: string,
    insightName: string,
    status: HealthStatus,
    category: string
  ) {
    this.LogDetectorSummarySelection(
      parentDetectorId,
      insightName,
      status,
      category
    );
    this._log(
      V2EventType[V2EventType.DetectorSummaryInsightSelected],
      category,
      {
        parentDetectorId: parentDetectorId,
        insightName: insightName,
        status: HealthStatus[status]
      }
    );
  }

  LogChatSearch(searchValue: string, category: string) {
    this._log(V2EventType[V2EventType.ChatSearch], category, {
      searchValue: searchValue
    });
  }

  LogChatSearchSelection(
    searchValue: string,
    category: string,
    selectionName: string,
    url: string,
    selectionType: string
  ) {
    this._log(V2EventType[V2EventType.ChatSearchSelected], category, {
      searchValue: searchValue,
      url: url,
      selectionName: selectionName,
      selectionType: selectionType
    });
  }

  LogAction(subcomponent: string, action: string, data?: any) {
    this._log(subcomponent, action, data);
  }
}
