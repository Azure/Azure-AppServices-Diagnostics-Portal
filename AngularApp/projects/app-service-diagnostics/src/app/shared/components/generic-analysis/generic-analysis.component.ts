import { Component, OnInit, ViewChild, Input, Output, EventEmitter, Inject } from '@angular/core';
import { GenericDetectorComponent } from '../generic-detector/generic-detector.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { FeatureNavigationService, TelemetryService, DiagnosticService, DownTime, DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG, TelemetryEventNames } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';
import { DetectorListAnalysisComponent } from 'diagnostic-data';
import { SearchAnalysisMode } from 'projects/diagnostic-data/src/lib/models/search-mode';
import { CXPChatService } from 'diagnostic-data';
import { GenericSupportTopicService } from '../../../../../../diagnostic-data/src/lib/services/generic-support-topic.service';
import { zoomBehaviors } from 'projects/diagnostic-data/src/lib/models/time-series';


@Component({
    selector: 'generic-analysis',
    templateUrl: './generic-analysis.component.html',
    styleUrls: ['./generic-analysis.component.scss', '../generic-detector/generic-detector.component.scss']
})
export class GenericAnalysisComponent extends GenericDetectorComponent implements OnInit {
    @Input() analysisId: string = "";
    @Input() searchTerm: string = "";
    @Input() searchMode: SearchAnalysisMode = SearchAnalysisMode.CaseSubmission;
    @Input() resourceId: string = "";
    @Input() targetedScore: number = 0;
    detectorId: string = "";
    detectorName: string = "";
    @Input() showSearchBar: boolean = undefined;
    @Output() onComplete = new EventEmitter<any>();

    SearchAnalysisMode = SearchAnalysisMode;
    displayDetectorContainer: boolean = true;
    searchBarFocus: boolean = false;
    downTime: DownTime;
    @ViewChild('detectorListAnalysis', { static: true }) detectorListAnalysis: DetectorListAnalysisComponent;
    downtimeZoomBehavior = zoomBehaviors.Zoom;
    isPublic: boolean = false;
    cxpChatTrackingId: string = '';
    supportTopicId: string = '';
    cxpChatUrl: string = '';

    constructor(private _activatedRouteLocal: ActivatedRoute, private _diagnosticServiceLocal: DiagnosticService, _resourceService: ResourceService, _authServiceInstance: AuthService, public _telemetryService: TelemetryService,
        _navigator: FeatureNavigationService, private _routerLocal: Router, private _supportTopicService: GenericSupportTopicService, private _cxpChatService: CXPChatService,
        @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
        super(_activatedRouteLocal, _diagnosticServiceLocal, _resourceService, _authServiceInstance, _telemetryService, _navigator, _routerLocal);
        this.isPublic = config && config.isPublic;
    }

    onUpdateDowntimeZoomBehavior(zoomBehavior: zoomBehaviors) {
        this.downtimeZoomBehavior = zoomBehavior;
    }

    onDowntimeChanged(event: DownTime) {
        this.downTime = event;
        this.detectorListAnalysis.downTime = event;
    }

    ngOnInit() {
        if (this.isPublic) {
            this.renderCXPChatButton();
        }

        this._activatedRouteLocal.paramMap.subscribe(params => {
            this.analysisId = (this.analysisId != 'searchResultsAnalysis' && this.analysisId != 'supportTopicAnalysis' && !!params.get('analysisId')) ? params.get('analysisId') : this.analysisId;
            this.analysisDetector = this.analysisId;
            this.detectorId = params.get('detectorName') === null ? "" : params.get('detectorName');
            this._activatedRouteLocal.queryParamMap.subscribe(qParams => {
                this.searchTerm = qParams.get('searchTerm') === null ? this.searchTerm : qParams.get('searchTerm');
                if (this.analysisId === "searchResultsAnalysis" && ((this.searchTerm && this.searchTerm.length > 0) || this.searchMode !== SearchAnalysisMode.Genie)) {
                    //Show search bar in case submission or if not passing searchTerm
                    this.showSearchBar = this.searchMode === SearchAnalysisMode.CaseSubmission || !this.searchTerm ? true : this.showSearchBar;

                    if(!this.searchTerm) {
                        this._telemetryService.logEvent(TelemetryEventNames.EmptySearchTerm, {
                            searchMode: SearchAnalysisMode[this.searchMode]
                        });
                    }

                    this.displayDetectorContainer = false;
                }
                else {
                    if (this.analysisId === 'supportTopicAnalysis' && this.searchTerm && this.searchTerm.length > 0) {
                        this.displayDetectorContainer = false;
                    }
                    this.showSearchBar = false;
                }

                this._telemetryService.logEvent("GenericAnalysisViewLoaded", {
                    'AnalysisId': this.analysisId,
                    'DetectorId': this.detectorId,
                });

                this._diagnosticServiceLocal.getDetectors().subscribe(detectorList => {
                    if (detectorList) {
                        if (this.detectorId !== "") {
                            let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
                            this.detectorName = currentDetector.name;
                        }
                    }
                });
            });
        });
    }

    updateLoadingStatus(dataOutput) {
        this.onComplete.emit(dataOutput);
    }

    triggerSearch() {
        if (this.searchTerm && this.searchTerm.length > 1) {
            this.searchBarFocus = false;
            var searchBar = document.getElementById('caseSubmissionFlowSearchBar');
            searchBar.blur();
            this._routerLocal.navigate([`../../${this.analysisId}/search`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge', queryParams: { searchTerm: this.searchTerm } });
        }
    }

    focusSearch() {
        var searchBar = document.getElementById('caseSubmissionFlowSearchBar');
        searchBar.focus();
        this.searchBarFocus = true;
    }

    showChatButton(): boolean {
        return this.isPublic && this.cxpChatTrackingId != '' && this.cxpChatUrl != '';
    }

    renderCXPChatButton() {
        if (this.cxpChatTrackingId === '' && this.cxpChatUrl === '') {
            let effectiveSupportTopicId: string = '';
            effectiveSupportTopicId = (this._supportTopicService && this._supportTopicService.sapSupportTopicId) ? this._supportTopicService.sapSupportTopicId : this._supportTopicService.supportTopicId;
            if (this._supportTopicService && this._cxpChatService && this._cxpChatService.isSupportTopicEnabledForLiveChat(effectiveSupportTopicId)) {
                this.cxpChatTrackingId = this._cxpChatService.generateTrackingId(effectiveSupportTopicId);
                this.supportTopicId = effectiveSupportTopicId;
                this._cxpChatService.getChatURL(effectiveSupportTopicId, this.cxpChatTrackingId).subscribe((chatApiResponse: any) => {
                    if (chatApiResponse && chatApiResponse != '') {
                        this.cxpChatUrl = chatApiResponse;
                    }
                });
            }
        }
    }
}
