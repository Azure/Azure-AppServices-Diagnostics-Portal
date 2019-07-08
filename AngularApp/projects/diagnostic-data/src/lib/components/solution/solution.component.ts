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
    this.showActionButton = this.solution.Action != ActionType.Markdown;

    let uriParts = this.solution.ResourceUri.split('/');
    this.appName = uriParts[uriParts.length - 1];

    if (this.renderedInternalMarkdown === '') {
        this.buildInternalText();
    }

    this.prepareAction();
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
    }

    this.convertOptions(actionOptions);
  }

  buildInternalText() {
    let markdownBuilder = this.solution.InternalMarkdown;

    let detectorLink = UriUtilities.BuildDetectorLink(this.solution.ResourceUri, this.solution.DetectorId);
    let detectorLinkMarkdown = `Go to [App Service Diagnostics](${detectorLink})`;

    if (markdownBuilder.toLowerCase().includes("{detectorlink}")) {
        markdownBuilder = markdownBuilder.replace(/{detectorlink}/gi, detectorLink);
    } else if (!markdownBuilder.includes(detectorLinkMarkdown)) {
        markdownBuilder = markdownBuilder + "\n\n" + detectorLinkMarkdown;
    }

    this.renderedInternalMarkdown = markdownBuilder;
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

  lowercaseFirst(target: string): string {
    return target.charAt(0).toLowerCase() + target.slice(1);
  }

  convertOptions(actionOptions: {}) {
    let overrideOptions = {};
    for (let key in actionOptions) {
      overrideOptions[this.lowercaseFirst(key)] = actionOptions[key];
    }

    this.overrideOptions = {...overrideOptions, ...this.solution.OverrideOptions};
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
