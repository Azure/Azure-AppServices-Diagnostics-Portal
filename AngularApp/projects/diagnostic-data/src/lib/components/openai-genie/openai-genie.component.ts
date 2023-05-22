import { Component, Inject, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { OpenAIArmService } from '../../services/openai-arm.service';
import { GenericResourceService } from '../../services/generic-resource-service';

@Component({
    selector: 'openai-genie',
    templateUrl: './openai-genie.component.html',
    styleUrls: ['./openai-genie.component.scss']
})

export class OpenAIGenieComponent extends DataRenderBaseComponent implements OnInit {
    isPublic: boolean = false;
    deepSearchSolution: string = "";
    showDeepSearchSolution: boolean = false;
    fetchingDeepSearchSolution: boolean = false;
    showErrorMessage: boolean = false;
    errorMessage: string = "";
    enabledPesIds: string[] = ["14748"];
    isDisabled: boolean = false;
    solutionTitleImgSrc: string = "assets/img/ai_powered_diagnotics_icon.svg";
    @Input() userQuery: string = "";
    @Input() diagnosticToolFindings: string = "";
    @Input() onCallFailure: () => {};
    @Output() onComplete: EventEmitter<any> = new EventEmitter<any>();
    
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _openAIArmService: OpenAIArmService, private _resourceService: GenericResourceService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
    }

    handleFailure() {
        this.isDisabled = true;
        this.deepSearchSolution = "";
        this.showDeepSearchSolution = false;
        this.fetchingDeepSearchSolution = false;
        this.onCallFailure();
    }

    ngOnInit() {
        if (this.userQuery && this.userQuery.length > 0) {
            this._resourceService.getPesId().subscribe(pesId => {
                if (this.enabledPesIds.includes(pesId)) {
                    this.triggerSearch();
                }
                else {
                    this.handleFailure();
                }
            });
        }
        else {
            this.handleFailure();
        }
    }

    /*
    // Keeping request failure scenario dormant for now
    handleRequestFailure() {
        this.errorMessage = "An error occurred while fetching the solution. Click on the button to try again.";
        this.showErrorMessage = true;
        this.onCallFailure();
    }*/

    extractTextFromHTML(s) {
        var span = document.createElement('span');
        span.innerHTML = s;
        return span.textContent || span.innerText;
    }

    cleanDiagnosticInsights(diagnosticInsights){
        return this.extractTextFromHTML(diagnosticInsights);
        //If needed in future we could do the below replacement of characters as well
        //.replace(/[\W_\-%\.]+/g," ");
    }

    triggerSearch() {
        this.fetchingDeepSearchSolution = true;
        this._openAIArmService.getDeepSearchAnswer(`User query regarding ${this._resourceService.searchSuffix}: ${this.userQuery}`, this.cleanDiagnosticInsights(this.diagnosticToolFindings)).subscribe(result => {
            if (result && result.length > 0 && !result.includes("We could not find any information about that") && !result.includes("An error occurred.")) {
                this.isDisabled = false;
                this.deepSearchSolution = result;
                this.showDeepSearchSolution = true;
                this.fetchingDeepSearchSolution = false;
                this.onComplete.emit();
            }
            else {
                this.handleFailure();
            }
        },
        (err) => {
            this.handleFailure();
        });
    }
}  
