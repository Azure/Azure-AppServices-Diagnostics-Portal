import { Observable } from 'rxjs';
import { Component, Input } from '@angular/core';
import { Rendering } from '../../models/detector';
import { SolutionService } from '../../services/solution.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { UriUtilities } from '../../utilities/uri-utilities';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActionType, Solution } from './solution';

@Component({
    selector: 'solution',
    templateUrl: './solution.component.html',
    styleUrls: ['./solution.component.scss']
})
export class SolutionComponent extends DataRenderBaseComponent {
    @Input("data") solution: Solution;
    @Input() isIbizaSolution: boolean = false;
    renderingProperties: Rendering;
    actionStatus: string;
    confirmationMessage: string;
    defaultCopyText = 'Copy';
    copyText = this.defaultCopyText;
    appName: string;
    renderedInternalMarkdown = '';
    overrideOptions: {};
    showActionButton: boolean;

    constructor(telemetryService: TelemetryService, private _siteService: SolutionService) {
        super(telemetryService);
    }

    ngOnInit() {
        this.solution.Action = this.inferActionType(this.solution);
        this.showActionButton = this.solution.Action != ActionType.Markdown;

        let uriParts = this.solution.ResourceUri.split('/');
        this.appName = uriParts[uriParts.length - 1];

        if (this.renderedInternalMarkdown === '') {
            this.buildInternalText();
        }

        this.prepareAction();
    }

    inferActionType(solution: Solution): ActionType {
        if (solution.ApiOptions != undefined) {
            return ActionType.ArmApi;
        }
        if (solution.BladeOptions != undefined) {
            return ActionType.GoToBlade;
        }
        if (solution.TabOptions != undefined) {
            return ActionType.OpenTab;
        }

        if (solution.OverrideOptions == undefined) {
            return ActionType.Markdown;
        }

        let overrideKeys = Object.keys(solution.OverrideOptions).map(key => key.toLowerCase());
        if (overrideKeys.indexOf('route') > -1) {
            return ActionType.ArmApi;
        }
        if (overrideKeys.indexOf('taburl') > -1) {
            return ActionType.OpenTab;
        }
        if (overrideKeys.indexOf('detailblade') > -1) {
            return ActionType.GoToBlade;
        }
        if (overrideKeys.indexOf('stdout') > -1) {
            return ActionType.ToggleStdoutSetting;
        }

        return ActionType.Markdown;
    }

    public showCompletionConfirmation():boolean {
        return this.solution.Action!= ActionType.GoToBlade && this.solution.Action!= ActionType.OpenTab;
    }

    prepareAction() {
        let actionOptions = {};

        switch (this.solution.Action) {
            case (ActionType.ArmApi): {
                actionOptions = this.solution.ApiOptions;
                this.confirmationMessage = 'Completed';
                break;
            }
            case (ActionType.GoToBlade): {
                actionOptions = this.solution.BladeOptions;
                this.confirmationMessage = 'Blade Opened';
                break;
            }
            case (ActionType.OpenTab): {
                actionOptions = this.solution.TabOptions;
                this.confirmationMessage = 'Tab Opened';
                break;
            }
            case (ActionType.ToggleStdoutSetting) : {
                this.confirmationMessage = 'STDOUT Logging Enabled';
                break;
            }
        }

        this.convertOptions(actionOptions);
    }

    buildInternalText() {
        let markdownBuilder = this.solution?.InternalMarkdown ?? "";

        let detectorLink = UriUtilities.BuildDetectorLink(this.solution.ResourceUri, this.solution.DetectorId);
        let detectorLinkMarkdown = `Go to [App Service Diagnostics](${detectorLink})`;

        if (markdownBuilder && markdownBuilder.toLowerCase().includes("{detectorlink}")) {
            markdownBuilder = markdownBuilder.replace(/{detectorlink}/gi, detectorLink);
        } else if (!markdownBuilder.includes(detectorLinkMarkdown)) {
            markdownBuilder = markdownBuilder + "\n\n" + detectorLinkMarkdown;
        }

        this.renderedInternalMarkdown = markdownBuilder;
    }

    lowercaseFirst(target: string): string {
        return target.charAt(0).toLowerCase() + target.slice(1);
    }

    convertOptions(actionOptions: {}) {
        let overrideOptions = {};
        for (let key in actionOptions) {
            overrideOptions[this.lowercaseFirst(key)] = actionOptions[key];
        }

        this.overrideOptions = { ...overrideOptions, ...this.solution.OverrideOptions };
    }

    performAction() {
        this.actionStatus = "Running...";

        this.chooseAction().subscribe(res => {
            if (res.ok == undefined || res.ok) {
                this.actionStatus = this.confirmationMessage;
            } else {
                this.actionStatus = `Error completing request. Status code: ${res.status}`;
            }
        });
    }

    chooseAction(): Observable<any> {
        switch (this.solution.Action) {
            case (ActionType.ArmApi): {
                return this._siteService.ArmApi(this.solution.ResourceUri, this.overrideOptions);
            }
            case (ActionType.GoToBlade): {
                return this._siteService.GoToBlade(this.solution.ResourceUri, this.overrideOptions);
            }
            case (ActionType.OpenTab): {
                return this._siteService.OpenTab(this.solution.ResourceUri, this.overrideOptions);
            }
            case (ActionType.ToggleStdoutSetting): {
                return this._siteService.ToggleStdoutSetting(this.solution.ResourceUri, this.overrideOptions);
            }
            default: {
                throw new Error(`ActionType ${this.solution.Action} does not have a corresponding action`);
            }
        }
    }

    copyInstructions(copyValue: string) {
        this.copyText = "Copying..";

        let selBox = document.createElement('textarea');
        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = copyValue;
        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();
        document.execCommand('copy');
        document.body.removeChild(selBox);

        this.copyText = "Copied!";

        this.logTextCopied();

        setTimeout(() => {
            this.copyText = this.defaultCopyText;
        }, 2000);
    }

    logTextCopied() {
        this.telemetryService.logEvent('SolutionTextCopied',
            {
                'solutionName': this.solution.Name,
                'appName': this.appName
            }
        );
    }

}
