import { SolutionUIModelBase } from './solution-ui-model-base';
import { SolutionProperties, SubAction } from './solutionproperties';
import { SolutionType, ActionType, ActionStatus } from '../enumerations';
import { INameValuePair } from '../namevaluepair';
import { SiteService, AvailabilityLoggingService } from '../../services';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/finally';

export abstract class InlineSolutionUIModel extends SolutionUIModelBase {
    private allSubActionsCompleted: boolean = false;
    private allSubActionSuccessful: boolean = false;

    constructor(rank: number, properties: SolutionProperties, _logger: AvailabilityLoggingService) {
        super(rank, properties, _logger);
    }

    run(): void {
        if (this.properties && this.properties.subActions && this.properties.subActions.length > 0) {

            this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), "inline", this.properties.actionText);
            this._logger.LogInlineActionTriggered(this.properties.actionText, this.properties.title);

            this._startRunningSubActions(0);
        }
    }

    private _startRunningSubActions(index: number): void {

        if (index < 0 || index >= this.properties.subActions.length) {
            this.allSubActionsCompleted = true;
            if (typeof (this.properties.subActions.find(x => x.status === ActionStatus.Failed)) === 'undefined') {
                this.allSubActionSuccessful = true;
            }
            return;
        }

        this.properties.subActions[index].status = ActionStatus.Running;

        this.executeSubAction(this.properties.subActions[index]).subscribe((data: boolean) => {
            let status: string = '';
            if (data === true) {
                this.properties.subActions[index].status = ActionStatus.Passed;
                status = 'passed';
            }
            else {
                this.properties.subActions[index].status = ActionStatus.Failed;
                status = 'failed';
            }

            this._logger.LogInlineSubActionSummary(this.properties.subActions[index].title, this.properties.actionText, status);
            this._startRunningSubActions(index + 1);

        }, err => {
            this.properties.subActions[index].status = ActionStatus.Failed;
            this._logger.LogInlineSubActionSummary(this.properties.subActions[index].title, this.properties.actionText, 'failed');

            this._startRunningSubActions(index + 1);
        });
    }

    protected abstract executeSubAction(subAction: SubAction): Observable<boolean>;
}

export class RestartProcessSolution extends InlineSolutionUIModel {

    constructor(rank: number, parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {

        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 1;
        this.properties.title = "Restart site process on specific instance(s)";
        this.properties.description = "This action will only kill a specific process on specified instances. Other processes are not affected and the whole site is not restarted.";
        this.properties.type = SolutionType.QuickSolution;
        this.properties.actionType = ActionType.Inline;
        this.properties.actionText = "Restart site process on instance(s)";

        for (var iter = 0; parameters && iter < parameters.length; iter++) {
            let subAction = new SubAction();

            let processNameItem = parameters[iter].find(p => p.name.toLowerCase() === "processname");
            let siteNameItem = parameters[iter].find(p => p.name.toLowerCase() === "sitename");
            let machineNameItem = parameters[iter].find(p => p.name.toLowerCase() === "machinename");
            subAction.parameter = parameters[iter];
            subAction.title = `Stop ${processNameItem.value}(${siteNameItem.value}) on ${machineNameItem.value}`;

            this.properties.subActions.push(subAction);
        }
    }

    public executeSubAction(subAction: SubAction): Observable<boolean> {

        let subscriptionId = subAction.parameter.find(p => p.name.toLowerCase() === "subscriptionid").value;
        let resourceGroup = subAction.parameter.find(p => p.name.toLowerCase() === "resourcegroup").value;
        let siteName = subAction.parameter.find(p => p.name.toLowerCase() === "sitename").value;
        let instanceId = subAction.parameter.find(p => p.name.toLowerCase() === "instanceid").value;

        // This will be overridden if possible in siteService.killW3wpOnInstance()
        let scmHostName = `https://${siteName}.scm.azurewebsites.net`;

        return this._siteService.killW3wpOnInstance(subscriptionId, resourceGroup, siteName, scmHostName, instanceId);
    }
}

export class RestartSiteSolution extends InlineSolutionUIModel {

    constructor(rank: number, parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {

        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 2;
        this.properties.title = "Restart your app";
        this.properties.description = "This action will restart the whole application across all the instances where it is running.";
        this.properties.type = SolutionType.QuickSolution;
        this.properties.actionType = ActionType.Inline;
        this.properties.actionText = "Restart Application";

        for (var iter = 0; parameters && iter < parameters.length; iter++) {
            let subAction = new SubAction();
            let siteNameItem = parameters[iter].find(p => p.name.toLowerCase() === "sitename");
            subAction.parameter = parameters[iter];
            subAction.title = `Restart App : ${siteNameItem.value}`;

            this.properties.subActions.push(subAction);
        }
    }

    executeSubAction(subAction: SubAction): Observable<boolean> {

        let subscriptionId = subAction.parameter.find(p => p.name.toLowerCase() === "subscriptionid").value;
        let resourceGroup = subAction.parameter.find(p => p.name.toLowerCase() === "resourcegroup").value;
        let siteName = subAction.parameter.find(p => p.name.toLowerCase() === "sitename").value;

        if (subscriptionId && resourceGroup && siteName) {
            return this._siteService.restartSite(subscriptionId, resourceGroup, siteName);
        }
    }
}