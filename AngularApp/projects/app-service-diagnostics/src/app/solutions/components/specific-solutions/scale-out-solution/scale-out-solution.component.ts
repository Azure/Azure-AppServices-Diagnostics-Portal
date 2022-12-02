import { Component, Input } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { ServerFarm } from '../../../../shared/models/server-farm';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';
import { PortalActionService } from '../../../../shared/services/portal-action.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';

@Component({
  templateUrl: 'scale-out-solution.component.html',
  styleUrls: [
    '../../../styles/solutions.scss',
    'scale-out-solution.component.scss'
  ]
})
export class ScaleOutSolutionComponent implements SolutionBaseComponent {
  @Input() data: SolutionData;

  title: string = 'Scale out your App Service Plan';
  description: string =
    'Increase the number of the instances in your app service plan. The requests to your app will be spread across all instances.';

  whyToScale: string[] = [
    'Your app is consistently using high levels of CPU on every instance.',
    'Your app is designed to do a lot of computation on each request or handle a high request load. Adding more instances can help spread the computational load across more instances. '
  ];

  whyNotToScale: string[] = [
    'You have numerous apps in this app service plan and you are running out of memory. Since apps often need a baseline amount of memory to run, scaling out will not always alleviate memory issues.',
    'You experience high resource usage during the hours of peak traffic for your app. A more cost effective solution would be AutoScale.'
  ];

  currentServerFarm: ServerFarm;

  suggestion: string;

  secondarySuggestion: string;

  constructor(
    private _serverFarmService: ServerFarmDataService,
    private _portalActionService: PortalActionService,
    private _logger: AvailabilityLoggingService
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
  }

  ngOnInit() {
    this.data.solution.order = this.data.solution.order
      ? this.data.solution.order
      : 9999;
    this._logger.LogSolutionDisplayed(
      'Scale Out',
      this.data.solution.order.toString(),
      'bot-sitecpuanalysis'
    );
  }

  generateSuggestion() {
    const sizeId = parseInt(
      this.currentServerFarm.sku.name.replace(
        this.currentServerFarm.sku.family,
        ''
      )
    );

    // TODO: if it is an ASE, we should offer premium sized instances

    if (this.currentServerFarm.sku.capacity > 1) {
      this.suggestion =
        `Your current App Service Plan has <b>${this.currentServerFarm.sku.capacity}</b> instances ` +
        `with <b>${this.currentServerFarm.additionalProperties.cores} CPU core${
          this.currentServerFarm.additionalProperties.cores > 1 ? 's' : ''
        }</b> each. ` +
        `You can use the below button to open the blade where you can add additional instances. `;

      this.secondarySuggestion =
        '<b>Note:</b> Scaling out will increase the cost of your App Service Plan. You can try scaling out and see if it solves your problem, and if not scale back to a lower number of instances.';
    } else if (this.currentServerFarm.sku.capacity === 1) {
      this.suggestion =
        `Your current App Service Plan has only ${this.currentServerFarm.sku.capacity} instance. ` +
        `We suggest scaling out to at least two instances to make sure that when we do infrastructure upgrades, your app has the best chance of being highly available.`;
    }
  }

  openBlade() {
    this._logger.LogSolutionTried(
      'Scale Out',
      this.data.solution.order.toString(),
      'blade',
      ''
    );
    this._portalActionService.openBladeScaleOutBlade();
  }
}
