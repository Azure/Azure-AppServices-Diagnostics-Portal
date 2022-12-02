import { Component, Input } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { ServerFarm } from '../../../../shared/models/server-farm';
import { Site } from '../../../../shared/models/site';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';
import { PortalActionService } from '../../../../shared/services/portal-action.service';

@Component({
  templateUrl: 'split-sites-serverfarms-solution.component.html',
  styleUrls: ['../../../styles/solutions.scss']
})
export class SplitSitesIntoDifferentServerFarmsSolutionComponent
  implements SolutionBaseComponent
{
  @Input() data: SolutionData;

  title: string = 'Split Apps Into Different App Service Plans';
  description: string =
    'All apps on the same App Service Plan will have to share the underlying resources such as CPU and memory. ' +
    'If you have too many apps in one server farm, it can cause resouce exhaustion. If one app is using a lot of resouces, it can affect the health of other apps in the same App Service Plan.';

  appServicePlanStrategies: string[] = [
    'Seperate apps that need a lot of resources into their own App Service Plan and adjust to the size and number of instances appropriate.',
    'If you have multiple apps that each need a lot of resources, it may be safer to seperate them into different App Service Plans to prevent one app from causing issues with another app.',
    'Move apps that have low traffic and low resource usage to a shared sku.'
  ];

  currentServerFarm: ServerFarm;
  sitesInServerFarm: Site[];

  suggestion: string;

  secondarySuggestion: string;

  constructor(
    private _serverFarmService: ServerFarmDataService,
    private _portalActionService: PortalActionService
  ) {
    this._serverFarmService.siteServerFarm.subscribe(
      (serverFarm) => {
        if (serverFarm) {
          this.currentServerFarm = serverFarm;
          this.generateSuggestion();
        }
      },
      (error) => {
        //TODO: handle error
      }
    );

    this._serverFarmService.sitesInServerFarm.subscribe((sitesInServerFarm) => {
      this.sitesInServerFarm = sitesInServerFarm;
    });
  }

  ngOnInit() {
    this.data.solution.order = this.data.solution.order
      ? this.data.solution.order
      : 9999;
  }

  generateSuggestion() {
    if (this.sitesInServerFarm && this.sitesInServerFarm.length >= 3) {
      this.suggestion = `There are ${
        this.sitesInServerFarm.length
      } apps in this App Service Plan including: <b>${this.sitesInServerFarm
        .map((x) => x.name)
        .slice(0, 2)
        .join(', ')}</b>`;
    }
  }

  openBlade() {
    this._portalActionService.openBladeScaleUpBlade();
  }
}
