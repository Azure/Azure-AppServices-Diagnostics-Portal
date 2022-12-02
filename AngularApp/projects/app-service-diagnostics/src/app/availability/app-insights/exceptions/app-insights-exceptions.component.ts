import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AppInsightsService } from '../../../shared/services/appinsights/appinsights.service';
import { AppInsightsQueryService } from '../../../shared/services/appinsights/appinsights-query.service';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { AvailabilityLoggingService } from '../../../shared/services/logging/availability.logging.service';

@Component({
  selector: 'app-insights-exceptions',
  templateUrl: 'app-insights-exceptions.component.html'
  //styleUrls: ['app-insights-dependencies.component.scss']
})
export class AppInsightsExceptionsComponent implements OnInit, OnChanges {
  subscriptionId: string;
  resourceGroup: string;
  siteName: string;
  slotName: string;

  @Input() startTime: string;
  @Input() endTime: string;
  @Input() includeMessage: boolean = true;

  loading: boolean;
  exceptions: any = [];
  exceptionTypes: string[];

  constructor(
    private _route: ActivatedRoute,
    public appInsightsService: AppInsightsService,
    private appInsightsQueryService: AppInsightsQueryService,
    private portalActionService: PortalActionService,
    private logger: AvailabilityLoggingService
  ) {
    this.exceptions = [];
    this.exceptionTypes = [];
  }

  ngOnInit(): void {
    this.subscriptionId = this._route.snapshot.params['subscriptionid'];
    this.resourceGroup = this._route.snapshot.params['resourcegroup'];
    this.siteName = this._route.snapshot.params['resourcename'];
    this.slotName = this._route.snapshot.params['slot']
      ? this._route.snapshot.params['slot']
      : '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.appInsightsService.loadAppDiagnosticPropertiesObservable.subscribe(
      (propertiesLoadStatus) => {
        if (
          changes['startTime'] &&
          this.appInsightsService.appInsightsSettings.validForStack
        ) {
          this.exceptions = [];
          this.loading = true;
          this.appInsightsService.loadAppInsightsResourceObservable.subscribe(
            (loadStatus) => {
              this.appInsightsQueryService
                .GetTopExceptions(this.startTime, this.endTime)
                .subscribe((data: any) => {
                  let rows = data['Tables'][0]['Rows'];
                  this.parseRowsIntoExceptions(rows);
                  this.loading = false;

                  this.logger.LogAppInsightsExceptionSummary(
                    this.startTime,
                    this.endTime,
                    this.exceptionTypes
                  );
                });
            }
          );
        }
      }
    );
  }

  parseRowsIntoExceptions(rows: any) {
    if (!rows || rows.length === 0) {
      return;
    }

    rows.forEach((element) => {
      this.exceptions.push({
        message: element[0],
        exception: element[1],
        count: element[3]
      });

      this.exceptionTypes.push(`${element[2]} [Count : ${element[3]}]`);
    });
  }

  OpenAppInsights() {
    this.portalActionService.openAppInsightsFailuresBlade(
      this.appInsightsService.appInsightsSettings.resourceUri
    );
    this.logger.LogClickEvent(
      'Application Insights Blade',
      'App Error Analysis'
    );
  }
}
