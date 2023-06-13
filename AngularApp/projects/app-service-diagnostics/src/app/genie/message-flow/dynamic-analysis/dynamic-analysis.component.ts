import { AfterViewInit, Component, EventEmitter, Injector, OnInit, Output, Input, ViewChild } from '@angular/core';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { ActivatedRoute, Router } from '@angular/router';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { SearchAnalysisMode } from 'projects/diagnostic-data/src/lib/models/search-mode';
import { ContentService } from '../../../shared-v2/services/content.service';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { v4 as uuid } from 'uuid';
import { ReplaySubject } from 'rxjs';
import { GenericAnalysisComponent } from '../../../shared/components/generic-analysis/generic-analysis.component';
import { HealthStatus } from 'diagnostic-data';

@Component({
    selector: 'dynamic-analysis',
    templateUrl: './dynamic-analysis.component.html',
    styleUrls: ['./dynamic-analysis.component.scss']
})
export class DynamicAnalysisComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    @ViewChild('genericAnalysis', { static: true }) genericAnalysis: GenericAnalysisComponent;

    @Input() keyword: string = "";
    @Input() resourceId: string = "";
    @Input() targetedScore: number = 0.5;
    @Input() documentResultCount: string = "3";
    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();
    @Input() showFeedbackForm: boolean = true;
    @Output() showFeedbackFormChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    loading: boolean = true;
    searchMode: SearchAnalysisMode = SearchAnalysisMode.Genie;
    viewUpdated: boolean = false;

    constructor(private _routerLocal: Router, private _activatedRouteLocal: ActivatedRoute, private injector: Injector, private _contentService: ContentService, private _chatState: CategoryChatStateService, private _logger: LoggingV2Service, private _telemetryService: TelemetryService) { }
    noSearchResult: boolean = false;
    showFeedback: boolean = undefined;
    feedbackText: string = "";
    readonly Feedback: string = 'Feedback';
    ratingEventProperties: { [name: string]: string };
    content: any[];
    analysisListSubject: ReplaySubject<any> = new ReplaySubject<any>(1);
    deepSearchEnabled: boolean = true;
    deepSearchCompleted: boolean = false;
    waitTimeBeforeDeepSearch: number = 20000; // Maximum wait 20 seconds before we force call deep search
    showDeepSearchSolution: boolean = false;
    diagnosticToolFindings: string = "";
    detectorInsightsReturned: boolean = false;
    webSearchEnabled: boolean = false;
    webSearchCompleted: boolean = false;
    detectorAnalysisCompleted: boolean = false;
    statusValue: any;

    ngOnInit() {
        this.searchMode = SearchAnalysisMode.Genie;
        this.keyword = this.injector.get('keyword');
        this.resourceId = this.injector.get('resourceId');
        this.targetedScore = this.injector.get('targetedScore');
        this.ratingEventProperties = {
            'DetectorId': "id",
            'Url': window.location.href
        };

        setTimeout(() => {
            if (!this.detectorInsightsReturned && !this.showDeepSearchSolution) {
                let issueDetectedViewModels = this.genericAnalysis ? this.genericAnalysis.getIssuesDetected(): [];
                this.diagnosticToolFindings = this.extractDiagnosticInsights(issueDetectedViewModels);
                this.showDeepSearchSolution = true;
            }
        }, this.waitTimeBeforeDeepSearch);

        setTimeout(() => {
            this.onViewUpdate.emit();
        }, 100);

        this.analysisListSubject.subscribe((dataOutput) => {
            this.detectorAnalysisCompleted = true;
            let nextKey = "";
            if ((dataOutput == undefined || dataOutput.data == undefined || dataOutput.data.detectors == undefined || dataOutput.data.detectors.length === 0) && (this.content == undefined || this.content.length == 0)) {
                this.noSearchResult = true;
            }
            else {
                this.noSearchResult = false;
                nextKey = "feedback";
            }

            this.statusValue = {
                status: dataOutput && dataOutput.status ? dataOutput.status : false,
                data: {
                    hasResult: !this.noSearchResult,
                    next_key: nextKey,
                }
            };
            this.detectorInsightsReturned = true;

            setTimeout(() => {
                this.onViewUpdate.emit();
            }, 100);

            if (!this.showDeepSearchSolution) {
                try {
                    this.diagnosticToolFindings = dataOutput.status && dataOutput.data ? this.extractDiagnosticInsights(dataOutput.data.issueDetectedViewModels): "";
                    this.showDeepSearchSolution = true;
                }
                catch (error) {
                    //This is not a breaking error
                    this.handleDeepSearchFailure();
                }
            }

            this.checkCompletionStatus();
        });
    }

    extractDiagnosticInsights(issueDetectedViewModels: any[]): string {
        let onlyCriticalInsights = issueDetectedViewModels.filter(x => x.model.status == HealthStatus.Critical);
        let insightsToUse = onlyCriticalInsights && (onlyCriticalInsights.length > 0)? onlyCriticalInsights: issueDetectedViewModels;
        if (insightsToUse && insightsToUse.length > 0) {
            let numInsights = insightsToUse.length;
            // Take maximum 4 insights
            numInsights = numInsights > 5 ? 5 : numInsights;
            let maxLengthEach = Math.floor(1000/numInsights);
            return insightsToUse.slice(0, numInsights).sort((a, b) => a.model.metadata.name - b.model.metadata.name).map((insight) => {
                return insight.insightDescription && insight.insightDescription.length > 0
                ? `Diagnostic Check: ${insight.model.metadata.name}\nFinding: ${insight.insightTitle}\nDescription: ${insight.insightDescription.substring(0, maxLengthEach)}`
                : `Diagnostic Check: ${insight.model.metadata.name}\nFinding: ${insight.insightTitle}`;
            }).join("\n\n");
        }
        else {
            return "";
        }
    }

    checkCompletionStatus() {
        if (this.detectorAnalysisCompleted && (!this.webSearchEnabled || (this.webSearchEnabled && this.webSearchCompleted)) && ((!this.deepSearchEnabled) || (this.deepSearchEnabled && this.deepSearchCompleted))) {
            setTimeout(() => {
                this.onViewUpdate.emit({data: "view-loaded"});
            }, 100);
            this.viewUpdated = true;
            this.onComplete.emit(this.statusValue);
        }
    }

    handleDeepSearchComplete(event)
    {
        this.deepSearchCompleted = true;
        this.checkCompletionStatus();
    }

    handleWebSearchComplete(event){
        this.webSearchCompleted = true;
        this.checkCompletionStatus();
    }

    handleDeepSearchFailure = () => {
        this.deepSearchEnabled = false;
        this.deepSearchCompleted = true;
        this.diagnosticToolFindings = "";
        this.webSearchEnabled = true;
        this.checkCompletionStatus();
    }

    enableSearchBox(){
        (<HTMLTextAreaElement>document.getElementById("genieChatBox")).disabled = false;
    }

    ngAfterViewInit() {
        if (!this.viewUpdated) {
            this.onViewUpdate.emit();
        }
    }

    updateStatus(dataOutput) {
        this.analysisListSubject.next(dataOutput);
    }

    addHelpfulFeedback() {
        this.feedbackText = 'Great to hear! From 1 to 5 stars, how helpful was this?';
        this.showFeedback = true;
    }

    addNotHelpfulFeedback() {
        this.feedbackText = 'Sorry to hear! Could you let us know how we can improve?';
        this.showFeedback = true;
    }
}

export class DynamicAnalysisMessage extends Message {
    constructor(keyword: string = "", resourceId: string = "", targetedScore: number = 0, messageDelayInMs: number = 0) {
        super(DynamicAnalysisComponent, {
            keyword: keyword,
            resourceId: resourceId,
            targetedScore: targetedScore,
        }, messageDelayInMs);
    }
}
