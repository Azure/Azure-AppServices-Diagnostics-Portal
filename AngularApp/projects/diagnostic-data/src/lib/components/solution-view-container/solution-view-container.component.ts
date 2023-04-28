
import { Inject, Output, EventEmitter } from '@angular/core';
import { Component, Input, OnInit } from '@angular/core';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { TelemetryService } from "../../services/telemetry/telemetry.service";

@Component({
  selector: 'solution-view-container',
  templateUrl: './solution-view-container.component.html',
  styleUrls: ['./solution-view-container.component.scss']
})
export class SolutionViewContainerComponent implements OnInit {
    @Input() solutionTitle: string = "";
    @Input() isRecommended: boolean = false;
    @Input() detector: string = "";
    @Input() isAnalysisView: boolean = false;
    @Input() isKeystoneDetector: boolean = false;
    @Input() showFeedbackQuestion: boolean = true;
    @Input() askReasonNotHelpful: boolean = false;
    @Input() metadataForLogging: any = {};
    @Input() showThanksMessage: boolean = false;

    @Output() showThanksMessageChange = new EventEmitter<any>();
    
    calloutSubmitDisabled: boolean = false;
    showReasonsCallout: boolean = false;
    calloutOptions: any[] = [
        {
            key: "solutionIsVague",
            text: "Solution is too vague"
        },
        {
            key: "solutionIsNotActionable",
            text: "Solution is not actionable"
        },
        {
            key: "solutionRequiresEffort",
            text: "Solution requires too much effort"
        },
        {
            key: "solutionDoesntApply",
            text: "Solution doesn't apply to me"
        },
        {
            key: "other",
            text: "Other"
        }
    ];

    selectedCalloutOption: any = this.calloutOptions[0];

    setCalloutSelection(event) {
        this.selectedCalloutOption = event.option;
    }

    closeReasonsCallout(){
        this.showReasonsCallout = false;
    }

    solutionTitleImageSrc: string = "../../../../assets/img/case-submission-flow/Help-and-Support.svg";

    yesSelected: boolean;
    noSelected: boolean;
    helpfulSelected: string;
    eventProps: { [name: string]: string } = {};
    isPublic: boolean;


    constructor(protected telemetryService: TelemetryService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
        this.isPublic = config && config.isPublic;
     }

    ngOnInit() {
        this.solutionTitleImageSrc = this.getIconImagePath();
        this.eventProps = {
            'Detector': this.detector,
            'IsKeystoneDetector': String(this.isKeystoneDetector),
            'SolutionTitle': this.solutionTitle,
            'IsRecommmended': String(this.isRecommended),
            'IsAnalysisView': String(this.isAnalysisView)
          };

        this.telemetryService.logEvent('SolutionLoaded', this.eventProps);
    }

    private getIconImagePath() {
         let publicImagePath = this.isRecommended ? "../../../../assets/img/case-submission-flow/Help-and-Support.svg" : "../../../../assets/img/case-submission-flow/Troubleshoot.svg";
         let internalImagePath = this.isRecommended ? "assets/img/Help-and-Support.svg" : "assets/img/Troubleshoot.svg";
         return this.isPublic ? publicImagePath : internalImagePath;
        }

    onCalloutSubmit() {
        this.calloutSubmitDisabled = true;
        const feedbackEventProps = {
            ...this.eventProps,
            'IsHelpful': this.helpfulSelected,
            ...(this.askReasonNotHelpful && this.noSelected)? {'NotHelpfulReason': this.selectedCalloutOption.text}: {},
            ...this.metadataForLogging
        }
        this.telemetryService.logEvent("SolutionFeedback", feedbackEventProps);
        this.showThanksMessage = this.yesSelected || this.noSelected;
        this.showThanksMessageChange.emit(this.showThanksMessage);
    }

    feedbackButtonClicked(helpful: boolean) {
        this.helpfulSelected = String(helpful);
        this.yesSelected = helpful;
        this.noSelected = !helpful;

        if (this.noSelected && this.askReasonNotHelpful) {
            this.showReasonsCallout = true;
        }

        else {

            const feedbackEventProps = {
                ...this.eventProps,
                'IsHelpful': String(helpful),
                ...this.metadataForLogging
            }

            this.telemetryService.logEvent("SolutionFeedback", feedbackEventProps);
            this.showThanksMessage = this.yesSelected || this.noSelected;
            this.showThanksMessageChange.emit(this.showThanksMessage);
        }
    }

}


