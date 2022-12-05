import { Injectable } from '@angular/core';
import { AppAnalysisService } from './appanalysis.service';
import { SiteService } from './site.service';
import { IncidentNotification, IncidentStatus } from '../models/icm-incident';
import { AuthService } from '../../startup/services/auth.service';
import { ResourceType } from '../models/portal';
import { LoggingService } from './logging/logging.service';
import { forkJoin } from 'rxjs';

@Injectable()
export class ServiceIncidentService {
  public incidents: IncidentNotification[] = [];
  public hasActiveIncidents: boolean = false;
  public notificationMessage: string;

  constructor(
    private _appAnalysisService: AppAnalysisService,
    private _siteService: SiteService,
    private _logger: LoggingService,
    private _authService: AuthService
  ) {
    this._authService.getStartupInfo().subscribe((startupInfo) => {
      if (startupInfo.resourceType === ResourceType.Site) {
        this._siteService.currentSiteMetaData.subscribe((site) => {
          if (site) {
            const serviceHealth = this._appAnalysisService.getDetectorResource(
              site.subscriptionId,
              site.resourceGroupName,
              site.siteName,
              site.slot,
              'availability',
              'servicehealth'
            );
            const customerIncident =
              this._appAnalysisService.getDetectorResource(
                site.subscriptionId,
                site.resourceGroupName,
                site.siteName,
                site.slot,
                'availability',
                'customerincident'
              );

            forkJoin(serviceHealth, customerIncident).subscribe((responses) => {
              responses.forEach((response) => {
                response.abnormalTimePeriods.forEach((period) => {
                  const incident =
                    IncidentNotification.fromAbnormalTimePeriod(period);
                  this.incidents.push(incident);
                });
              });

              if (this.incidents.length > 0) {
                this.hasActiveIncidents =
                  this.incidents.filter(
                    (i) => i.status === IncidentStatus.Active
                  ).length > 0;

                this.notificationMessage = this.hasActiveIncidents
                  ? 'There is an active service incident that may be affecting your app. Click here to learn more'
                  : 'There is a service incident that may have affected your app. Click here to learn more';

                // Log Incident Details and Notification
                this.incidents.forEach((incident) => {
                  this._logger.LogIncidentIncidentDetails(incident);
                });

                this._logger.LogIncidentNotification(this.hasActiveIncidents);
              }
            });
          }
        });
      }
    });
  }
}

// Save for testing
const sampleIncident: any = {
  StartTime: '2018-03-04T00:00:00Z',
  EndTime: '2018-03-05T00:00:00Z',
  IssueDetected: true,
  DetectorDefinition: {
    Name: 'servicehealth',
    DisplayName: 'Service Health',
    Description: null,
    Rank: 1.0,
    IsEnabled: true
  },
  Metrics: [
    {
      Name: 'Service Incident',
      Unit: null,
      StartTime: '2018-03-04T00:00:00Z',
      EndTime: '2018-03-05T00:00:00Z',
      TimeGrain: '00:05:00',
      Values: [
        {
          Timestamp: '2018-03-04T18:45:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T18:50:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T18:55:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T19:00:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T19:05:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T19:10:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T19:15:00Z',
          Total: 1.0,
          IsAggregated: true
        },
        {
          Timestamp: '2018-03-04T19:20:00Z',
          Total: 1.0,
          IsAggregated: true
        }
      ]
    }
  ],
  AbnormalTimePeriods: [
    {
      startTime: '2018-03-04T18:46:58Z',
      endTime: '2018-03-04T19:22:00Z',
      message:
        'The limited Azure service outage that impacted your app has been mitigated and resolved',
      source: 'servicehealth',
      Priority: 1.0,
      metaData: [
        [
          { name: 'Status', value: 'Active' },
          { name: 'ShowNotification', value: 'True' },
          {
            name: 'MessageHTML',
            value:
              '\r\n            <p><b>Summary of impact:</b> Starting 18:46 UTC on 04 Mar 2018 to 19:22 UTC on 04 Mar 2018, your app may have been impacted due to an App Service outage. \r\n                An alert/technical escalation has already been filed and our Microsoft engineers have been notified.</p>\r\n            <p><b>Details:</b> {details}</p>'
          }
        ]
      ],
      Type: 'ServiceIncident',
      Solutions: []
    }
  ],
  Data: [],
  ResponseMetaData: null
};
