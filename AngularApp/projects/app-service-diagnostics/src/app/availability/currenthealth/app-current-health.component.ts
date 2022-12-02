import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { IDetectorResponse } from '../../shared/models/detectorresponse';
import { Observable, BehaviorSubject } from 'rxjs';
import { GraphHelper } from '../../shared/utilities/graphHelper';
import { SupportBladeDefinitions } from '../../shared/models/portal';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';

@Component({
  selector: 'app-current-health',
  templateUrl: 'app-current-health.component.html'
})
export class AppCurrentHealthComponent implements OnInit {
  constructor(
    private _portalActionService: PortalActionService,
    private _logger: AvailabilityLoggingService
  ) {}

  private _runtimeAvailabilitySubject: BehaviorSubject<IDetectorResponse> =
    new BehaviorSubject<IDetectorResponse>(null);
  private _serviceHealthSubject: BehaviorSubject<IDetectorResponse> =
    new BehaviorSubject<IDetectorResponse>(null);

  @Input()
  set runtimeAvailabilityResponse(value: IDetectorResponse) {
    this._runtimeAvailabilitySubject.next(value);
  }

  get runtimeAvailabilityResponse(): IDetectorResponse {
    return this._runtimeAvailabilitySubject.getValue();
  }

  @Input()
  set serviceHealthResponse(value: IDetectorResponse) {
    this._serviceHealthSubject.next(value);
  }

  get serviceHealthResponse(): IDetectorResponse {
    return this._serviceHealthSubject.getValue();
  }

  @Input()
  bladeOpenedFromSupportTicketFlow: boolean;

  @Output() refreshClicked: EventEmitter<any> = new EventEmitter<any>();

  isAppCurrentlyHealthy: boolean;
  isServiceCurrentlyHealthy: boolean;
  serviceCurrentStatusString: string;
  appCurrentStatusString: string;
  lastUpdatedTime: string;

  loadingAppHealthStatus: boolean = true;
  loadingServiceHealthStatus: boolean = true;

  ngOnInit(): void {
    let self = this;

    this._runtimeAvailabilitySubject.subscribe((response) => {
      if (
        this.runtimeAvailabilityResponse &&
        this.runtimeAvailabilityResponse.data &&
        this.runtimeAvailabilityResponse.data.length > 0
      ) {
        self.lastUpdatedTime = `${GraphHelper.convertToUTCTime(
          new Date()
        ).toLocaleString()} (UTC)`;

        let currentAppHealth = this.runtimeAvailabilityResponse.data[0].find(
          (p) => p.name.toLocaleLowerCase() === 'currentapphealth'
        );
        if (
          currentAppHealth &&
          currentAppHealth.value.toLocaleLowerCase() === 'unhealthy'
        ) {
          self.isAppCurrentlyHealthy = false;
          self.appCurrentStatusString =
            'Your app is experiencing server errors';
        } else {
          self.isAppCurrentlyHealthy = true;
          self.appCurrentStatusString = 'Your app is healthy';
        }

        self.loadingAppHealthStatus = false;
      } else {
        self.isAppCurrentlyHealthy = undefined;
        self.loadingAppHealthStatus = true;
      }
    });

    this._serviceHealthSubject.subscribe((response) => {
      if (this.serviceHealthResponse) {
        if (
          this.serviceHealthResponse.abnormalTimePeriods &&
          this.serviceHealthResponse.abnormalTimePeriods.length > 0 &&
          new Date(
            this.serviceHealthResponse.abnormalTimePeriods[
              this.serviceHealthResponse.abnormalTimePeriods.length - 1
            ].endTime
          ) >= new Date(this.serviceHealthResponse.endTime)
        ) {
          self.isServiceCurrentlyHealthy = false;
          self.serviceCurrentStatusString = 'Platform is unhealthy';
        } else {
          self.isServiceCurrentlyHealthy = true;
          self.serviceCurrentStatusString = 'Platform is healthy';
        }

        self.loadingServiceHealthStatus = false;
      } else {
        self.isServiceCurrentlyHealthy = undefined;
        self.loadingServiceHealthStatus = true;
      }
    });
  }

  openLiveTrafficBlade() {
    this._portalActionService.openSupportIFrame(SupportBladeDefinitions.Pulse);
  }

  refresh(): void {
    this.refreshClicked.emit();
    this._logger.LogClickEvent('Refresh', 'AppAnalysis');
  }
}
