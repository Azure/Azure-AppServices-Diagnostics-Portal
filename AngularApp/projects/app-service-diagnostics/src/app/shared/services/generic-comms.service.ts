import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Communication, ResourceDescriptor } from 'diagnostic-data';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';
import { StartupInfo } from '../../shared/models/portal';
import { LoggingService } from '../../shared/services/logging/logging.service';
import { mergeMap, tap, map } from 'rxjs/operators';
import { CommunicationStatus } from '../../../../../diagnostic-data/src/lib/models/communication';

@Injectable()
export class GenericCommsService {
  constructor(
    private _authService: AuthService,
    private _armService: ArmService,
    private _logger: LoggingService
  ) {}

  public getServiceHealthCommunications(): Observable<Communication[]> {
    return this._authService.getStartupInfo().pipe(
      mergeMap((startupInfo: StartupInfo) => {
        var subscriptionId: string = ResourceDescriptor.parseResourceUri(
          startupInfo.resourceId
        ).subscription;
        return this._armService
          .getArmResource<any>(
            `/subscriptions/${subscriptionId}/providers/Microsoft.ResourceHealth/events`,
            '2018-07-01'
          )
          .pipe(
            map((response: any) => {
              var commsList = new Array();
              var alertFound: boolean = false;
              response.value.forEach((item: any) => {
                if (
                  item.properties &&
                  item.properties.eventType &&
                  item.properties.eventType === 'ServiceIssue'
                ) {
                  var comm = {
                    publishedTime: item.properties['lastUpdateTime'],
                    title: item.properties['title'],
                    richTextMessage: item.properties['description'],
                    status:
                      item.properties['status'] === 'Active'
                        ? CommunicationStatus.Active
                        : CommunicationStatus.Resolved,
                    incidentId: item.name,
                    isAlert: false,
                    isExpanded: false,
                    commType: 0
                  };

                  commsList.push(comm);
                }
              });

              var activeComm = commsList.find(
                (item) => item.status === CommunicationStatus.Active
              );
              if (activeComm) {
                activeComm.isAlert = true;
                this._logger.LogAzureCommShown(
                  activeComm.incidentId,
                  activeComm.title,
                  'ServiceHealth',
                  activeComm.isExpanded,
                  activeComm.status === 0,
                  activeComm.publishedTime
                );
              }

              return commsList;
            })
          );
      })
    );
  }

  public openMoreDetails() {}
}
