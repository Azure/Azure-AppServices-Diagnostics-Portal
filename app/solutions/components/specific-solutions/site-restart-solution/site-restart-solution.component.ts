import { Component, Input, OnInit } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { ApplicationRestartInfo } from '../../../../shared/models/solution-metadata';
import { PortalActionService, SiteService, ServerFarmDataService, AvailabilityLoggingService } from '../../../../shared/services';
import { ActionStatus } from '../../../../shared/models/enumerations';

@Component({
    templateUrl: 'site-restart-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'site-restart-solution.component.css'
    ]
})
export class SiteRestartComponent implements SolutionBaseComponent, OnInit {

    @Input() data: SolutionData;

    includeTargetedAppRestart: boolean = true;

    title: string = "Perform a Web App Restart";
    description: string = "If your app is in a bad state, performing a web app restart can be enough to fix the problem in some cases. There are different types of restart, Advanced Application Restart and the standard App Restart";

    thingsToKnowBefore: string[] = [
        "A restart is only a mitigation, which means it is not solving the root cause of why your app is in a bad state",
        "If your app has a code issue or consistently consumes a high level resources (i.e. CPU, memory) in an unsafe way, a restart will not permanently fix the issue",
        "If you want to get to the root cause of the problem, you could take a memory dump of your process before restarting"
    ]

    advancedAppRestartDescription: string =
    "Advanced Application Restart is the perfect solution if your app is running on multiple instances but you only want to restart your app on specific instances.";

    appRestartDescription: string = "An App Restart will kill the app process on all instances."

    restartAppStatus: ActionStatus = ActionStatus.NotStarted
    restartAppSuccessMessage: string = "App Restart Successful. Check and see if this issue is resolved."
    restartAppFailureMessage: string = "App Restart Failed. Please try again or try a different solution."

    siteToBeRestarted: ApplicationRestartInfo;
    instanceList: string;

    constructor(private _siteService: SiteService, _portalActionService: PortalActionService, _serverFarmService: ServerFarmDataService, private _logger: AvailabilityLoggingService) {
        
    }

    ngOnInit(): void {
        this.includeTargetedAppRestart = this.data.solution.id === 1;

        if (this.includeTargetedAppRestart) {
            this.siteToBeRestarted = MetaDataHelper.getAdvancedApplicationRestartData(this.data.solution.data);
            this.instanceList = this.siteToBeRestarted.instances.map(instance => instance.machineName).join(", ");
            this._logger.LogSolutionDisplayed('Advanced App Restart', this.data.solution.order.toString(), 'bot-sitecpuanalysis');
        }
        else {
            this.siteToBeRestarted = MetaDataHelper.getRestartData(this.data.solution.data);
        }

        this._logger.LogSolutionDisplayed('App Restart', this.data.solution.order.toString(), 'bot-sitecpuanalysis');
    }

    restartSite() {
        this._logger.LogSolutionTried('App Restart', this.data.solution.order.toString(), 'inline', '');
        this.restartAppStatus = ActionStatus.Running
        this._siteService.restartSite(this.siteToBeRestarted.subscriptionId, this.siteToBeRestarted.resourceGroupName, this.siteToBeRestarted.siteName).subscribe(
            response => {
                this.restartAppStatus = response ? ActionStatus.Passed : ActionStatus.Failed;
            },
            error => {
                this.restartAppStatus = ActionStatus.Failed;
            });
    }

    advancedAppRestartSite() {
        //TODO: scmhostname
        this._logger.LogSolutionTried('Advanced App Restart', this.data.solution.order.toString(), 'inline', '')
        this.siteToBeRestarted.instances.forEach(instance => {
            this._siteService.killW3wpOnInstance(this.siteToBeRestarted.subscriptionId, this.siteToBeRestarted.resourceGroupName, this.siteToBeRestarted.siteName,
                '', instance.machineName);
        })

    }
}