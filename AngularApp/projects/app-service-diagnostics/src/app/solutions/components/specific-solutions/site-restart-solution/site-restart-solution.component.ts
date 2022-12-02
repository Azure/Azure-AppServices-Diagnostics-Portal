import { Component, Input, OnInit } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { ApplicationRestartInfo } from '../../../../shared/models/solution-metadata';
import { ActionStatus } from '../../../../shared/models/enumerations';
import { SiteService } from '../../../../shared/services/site.service';
import { PortalActionService } from '../../../../shared/services/portal-action.service';
import { ServerFarmDataService } from '../../../../shared/services/server-farm-data.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';

@Component({
  templateUrl: 'site-restart-solution.component.html',
  styleUrls: [
    '../../../styles/solutions.scss',
    'site-restart-solution.component.scss'
  ]
})
export class SiteRestartComponent implements SolutionBaseComponent, OnInit {
  @Input() data: SolutionData;

  includeTargetedAppRestart: boolean = true;

  title: string = 'Perform a Web App Restart';
  description: string =
    'If your app is in a bad state, performing a web app restart can be enough to fix the problem in some cases. There are different types of restart, Advanced Application Restart and the standard App Restart';

  thingsToKnowBefore: string[] = [
    'A restart is only a mitigation, which means it is not solving the root cause of why your app is in a bad state',
    'If your app has a code issue or consistently consumes a high level resources (i.e. CPU, memory) in an unsafe way, a restart will not permanently fix the issue',
    'If you want to get to the root cause of the problem, you could take a memory dump of your process before restarting'
  ];

  advancedAppRestartDescription: string =
    'Advanced Application Restart is the perfect solution if your app is running on multiple instances but you only want to restart your app on specific instances. ' +
    'This method relies on your kudu app, which runs alongside your app, to restart your app on each instance. If you have one or more instances where CPU is very high, ' +
    'it may mean that this method may not work, and you may want to try doing a full app restart.';

  appRestartDescription: string =
    'An App Restart will kill the app process on all instances.';

  restartAppStatus: ActionStatus = ActionStatus.NotStarted;
  restartAppSuccessMessage: string =
    'App Restart Successful. Check and see if this issue is resolved.';
  restartAppFailureMessage: string =
    'App Restart Failed. Please try again or try a different solution.';

  targetedRestartAppStatus: { instance: string; status: ActionStatus }[];
  targetedRestartAppSuccessMessage: string =
    'App Restarted Successfully on Instance';
  targetedRestartAppFailureMessage: string = 'App Restart Failed on Instance';

  siteToBeRestarted: ApplicationRestartInfo;
  instanceList: string;

  actionStatus = ActionStatus;

  constructor(
    private _siteService: SiteService,
    _portalActionService: PortalActionService,
    _serverFarmService: ServerFarmDataService,
    private _logger: AvailabilityLoggingService
  ) {}

  ngOnInit(): void {
    this.includeTargetedAppRestart = this.data.solution.id === 1;
    this.data.solution.order = this.data.solution.order
      ? this.data.solution.order
      : 9999;

    if (this.includeTargetedAppRestart) {
      this.siteToBeRestarted = MetaDataHelper.getAdvancedApplicationRestartData(
        this.data.solution.data
      );
      this.instanceList = this.siteToBeRestarted.instances
        .map((instance) => instance.machineName)
        .join(', ');
      this._logger.LogSolutionDisplayed(
        'Advanced App Restart',
        this.data.solution.order.toString(),
        'bot-sitecpuanalysis'
      );
    } else {
      this.siteToBeRestarted = MetaDataHelper.getRestartData(
        this.data.solution.data
      );
    }

    this._logger.LogSolutionDisplayed(
      'App Restart',
      this.data.solution.order.toString(),
      'bot-sitecpuanalysis'
    );
  }

  restartSite() {
    this._logger.LogSolutionTried(
      'App Restart',
      this.data.solution.order.toString(),
      'inline',
      ''
    );
    this.restartAppStatus = ActionStatus.Running;
    this._siteService
      .restartSite(
        this.siteToBeRestarted.subscriptionId,
        this.siteToBeRestarted.resourceGroupName,
        this.siteToBeRestarted.siteName
      )
      .subscribe(
        (response) => {
          this.restartAppStatus = response
            ? ActionStatus.Passed
            : ActionStatus.Failed;
        },
        (error) => {
          this.restartAppStatus = ActionStatus.Failed;
        }
      );
  }

  advancedAppRestartSite() {
    //TODO: scmhostname
    this.targetedRestartAppStatus = [];
    this._logger.LogSolutionTried(
      'Advanced App Restart',
      this.data.solution.order.toString(),
      'inline',
      ''
    );
    this.siteToBeRestarted.instances.forEach((instance) => {
      this.targetedRestartAppStatus.push({
        instance: instance.machineName,
        status: ActionStatus.Running
      });
      this._siteService
        .killW3wpOnInstance(
          this.siteToBeRestarted.subscriptionId,
          this.siteToBeRestarted.resourceGroupName,
          this.siteToBeRestarted.siteName,
          '',
          instance.instanceId
        )
        .subscribe(
          (response) => {
            const instanceStatus = this.targetedRestartAppStatus.find(
              (status) => status.instance === instance.machineName
            );
            instanceStatus.status = ActionStatus.Passed;
          },
          (error) => {
            const instanceStatus = this.targetedRestartAppStatus.find(
              (status) => status.instance === instance.machineName
            );
            instanceStatus.status = ActionStatus.Failed;
          }
        );
    });
  }
}
