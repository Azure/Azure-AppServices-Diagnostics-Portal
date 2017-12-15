import { Component, Input } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { AvailabilityLoggingService } from '../../../../shared/services';
import { SolutionData } from '../../../../shared/models/solution';


@Component({
    templateUrl: 'revert-deployment-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'revert-deployment-solution.component.css'
    ]
})
export class RevertDeploymentComponent implements SolutionBaseComponent {

    @Input() data: SolutionData;

    title: string = "Revert your deployment";

    description: string = "Quickly bring things back to normal by reverting back to a working deployment.";

    suggestion: string = "Please review your latest code changes or config changes that may have contributed to these failures and redeploy";

    educationInformation: string[] = [
        "If this is only a small blip in availability, please be aware that deploying new code may cause restarts and momentary availability blips.",
        "Azure App Service enables you to deploy in multiple ways. WebDeploy, Git, Site Swaps, etc. Using deployment mechanisms like Git and Site Swaps allow fast reversions when things go wrong."
    ];

    constructor(private _logger: AvailabilityLoggingService) {
    }

    ngOnInit() {
        this.data.solution.order = this.data.solution.order ? this.data.solution.order : 9999;
        this._logger.LogSolutionDisplayed('Scale Out', this.data.solution.order.toString(), 'bot-sitecpuanalysis');
    }
}
