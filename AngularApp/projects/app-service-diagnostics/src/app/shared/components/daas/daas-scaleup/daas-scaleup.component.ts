import { Component, OnInit } from '@angular/core';
import { ServerFarm } from '../../../models/server-farm';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { PortalActionService } from '../../../services/portal-action.service';
import { SolutionData } from '../../../models/solution';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
  selector: 'daas-scaleup',
  templateUrl: './daas-scaleup.component.html',
  styleUrls: ['./daas-scaleup.component.scss']
})
export class DaasScaleupComponent {
  currentServerFarm: ServerFarm;
  constructor(
    private _serverFarmService: ServerFarmDataService,
    private _portalActionService: PortalActionService,
    private _logger: AvailabilityLoggingService
  ) {
    this._serverFarmService.siteServerFarm.subscribe(
      (serverFarm) => {
        if (serverFarm) {
          this.currentServerFarm = serverFarm;
        }
      },
      (error) => {
        //TODO: handle error
      }
    );
  }

  openBlade() {
    this._logger.LogClickEvent('ScaleUp', 'DaaS');
    this._portalActionService.openBladeScaleUpBlade();
  }
}
