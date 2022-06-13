import { Moment } from 'moment';
import { v4 as uuid } from 'uuid';
import { Component, OnInit, Input, Inject, EventEmitter, Output, Optional } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { LoadingStatus } from '../../models/loading';
import { StatusStyles } from '../../models/styles';
import { DetectorControlService, TimePickerOptions } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Solution } from '../solution/solution';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { BehaviorSubject, forkJoin as observableForkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DetectorResponse, DetectorMetaData, HealthStatus, DetectorType, DownTime } from '../../models/detector';
import { Insight, InsightUtils } from '../../models/insight';
import { DataTableResponseColumn, DataTableResponseObject, DiagnosticData, RenderingType, Rendering, TimeSeriesType, TimeSeriesRendering } from '../../models/detector';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppInsightQueryMetadata, AppInsightData, BladeInfo } from '../../models/app-insights';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import { SearchAnalysisMode } from '../../models/search-mode';
import { GenieGlobals } from '../../services/genie.service';
import { SolutionService } from '../../services/solution.service';
import { PortalActionGenericService } from '../../services/portal-action.service';
import { detectorSearchEnabledPesIds, detectorSearchEnabledPesIdsInternal } from '../../models/search';
import { GenericResourceService } from '../../services/generic-resource-service';
import { zoomBehaviors } from '../../models/time-series';
import * as momentNs from 'moment';
const moment = momentNs;

import { ILinkProps, PanelType } from 'office-ui-fabric-react';
import { GenericBreadcrumbService } from '../../services/generic-breadcrumb.service';
import { GenericUserSettingService } from '../../services/generic-user-setting.service';

const WAIT_TIME_IN_SECONDS_TO_ALLOW_DOWNTIME_INTERACTION: number = 58;
const PERCENT_CHILD_DETECTORS_COMPLETED_TO_ALLOW_DOWNTIME_INTERACTION: number = 0.9;
@Component({
    selector: 'detector-list-analysis',
    templateUrl: './detector-list-analysis.component.html',
    styleUrls: ['./detector-list-analysis.component.scss'],
    animations: [
        trigger(
            'loadingAnimation',
            [
                state('shown', style({
                    opacity: 1
                })),
                state('hidden', style({
                    opacity: 0
                })),
                transition('* => *', animate('.3s'))
            ]
        )
    ]
})
export class DetectorListAnalysisComponent extends DataRenderBaseComponent implements OnInit {
    @Input() analysisId: string;
    @Input() searchMode: SearchAnalysisMode = SearchAnalysisMode.CaseSubmission;
    SearchAnalysisMode = SearchAnalysisMode;
    @Input() renderingOnlyMode: boolean = false;
    @Input() detectorViewModelsData: any;
    @Input() resourceId: string = "";
    @Input() targetedScore: number = 0.5;
    @Output() onComplete = new EventEmitter<any>();
    @Output() updateDowntimeZoomBehavior = new EventEmitter<any>();
    allowUpdateDowntimeZoomBehaviorEvent: boolean = false;
    timeWhenAnalysisStarted: Moment;
    downtimeResetTimer: any = null;
    @Input() searchTerm: string = "";
    @Input() keystoneSolutionView: boolean = false;
    analysisName: string = "";
    detectorViewModels: any[];
    detectorId: string;
    detectorName: string = '';
    contentHeight: string;
    detectors: any[] = [];
    LoadingStatus = LoadingStatus;
    HealthStatus = HealthStatus;
    issueDetectedViewModels: any[] = [];
    successfulViewModels: any[] = [];
    failedLoadingViewModels: any[] = [];
    detectorMetaData: DetectorMetaData[];
    private childDetectorsEventProperties = {};
    loadingChildDetectors: boolean = false;
    appInsights: any;
    allSolutions: Solution[] = [];
    allSolutionsMap: Map<string, Solution[]> = new Map<string, Solution[]>();
    loadingMessages: string[] = [];
    loadingMessageIndex: number = 0;
    loadingMessageTimer: any;
    showLoadingMessage: boolean = false;
    startTime: Moment;
    endTime: Moment;
    renderingProperties: Rendering;
    isPublic: boolean;
    showAppInsightsSection: boolean = true;
    isAppInsightsEnabled: boolean = false;
    appInsightQueryMetaDataList: AppInsightQueryMetadata[] = [];
    appInsightDataList: AppInsightData[] = [];
    diagnosticDataSet: DiagnosticData[] = [];
    loadingAppInsightsResource: boolean = true;
    loadingAppInsightsQueryData: boolean = true;
    supportDocumentContent: string = "";
    supportDocumentRendered: boolean = false;
    isDynamicAnalysis: boolean = false;
    searchId: string = null;
    showPreLoader: boolean = false;
    preLoadingErrorMessage: string = "Some error occurred while fetching diagnostics."
    showPreLoadingError: boolean = false;
    withinGenie: boolean = false;
    isSearchEmbedded: boolean = false;
    showSuccessfulChecks: boolean = true;
    showWebSearch: boolean = false;
    showWebSearchTimeout: any = null;
    searchDiagnosticData: DiagnosticData;
    readonly stringFormat: string = 'YYYY-MM-DDTHH:mm';
    public inDrillDownMode: boolean = false;
    drillDownDetectorId: string = '';
    totalChildDetectorsLoaded: number = 0;
    solutionPanelOpen: boolean = false;
    solutionPanelType: PanelType = PanelType.custom;
    solutionPanelOpenSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
    solutionTitle: string = "";
    expandIssuedAnalysisChecks: boolean = false;

    constructor(public _activatedRoute: ActivatedRoute, private _router: Router,
        private _diagnosticService: DiagnosticService, private _detectorControl: DetectorControlService,
        protected telemetryService: TelemetryService, public _appInsightsService: AppInsightsQueryService,
        private _supportTopicService: GenericSupportTopicService, protected _globals: GenieGlobals, private _solutionService: SolutionService,
        @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private portalActionService: PortalActionGenericService, private _resourceService: GenericResourceService, private _genericBreadcrumbService: GenericBreadcrumbService, private _genericUserSettingsService: GenericUserSettingService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;

        if (this.isPublic) {
            this._appInsightsService.CheckIfAppInsightsEnabled().subscribe(isAppinsightsEnabled => {
                this.isAppInsightsEnabled = isAppinsightsEnabled;
                this.loadingAppInsightsResource = false;
            });
        }
    }

    @Input()
    detectorParmName: string;

    public _downTime: DownTime = null;
    @Input()
    set downTime(downTime: DownTime) {
        if (!!downTime && !!downTime.StartTime && !!downTime.EndTime) {
            this._downTime = downTime;
            this.refresh();
        }
        else {
            this._downTime = null;
        }
    }

    withinDiagnoseAndSolve: boolean = !this._detectorControl.internalClient;

    ngOnInit() {
        this.withinGenie = this.analysisId === "searchResultsAnalysis" && this.searchMode === SearchAnalysisMode.Genie && this.searchTerm != "" && this.searchTerm.length > 0;
        this._activatedRoute.queryParamMap.subscribe(qParams => {
        })
        if (this.analysisId === "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length > 0) {
            this.refresh();
        }
        else {
            this._detectorControl.update.subscribe(isValidUpdate => {
                if (isValidUpdate) {
                    this.refresh();
                }
            });
        }

        this._genericUserSettingsService.getExpandAnalysisCheckCard().subscribe(expandAnalysisCheckCard => {
            this.expandIssuedAnalysisChecks = expandAnalysisCheckCard;
        })

        this.startTime = this._detectorControl.startTime;
        this.endTime = this._detectorControl.endTime;

        this._diagnosticService.getDetectors().subscribe(detectors => {
            const metaData = detectors.find(d => d.id === this.analysisId && d.type === DetectorType.Analysis);
            if (metaData) this.analysisName = metaData.name;
        })
    }

    toggleSuccessful() {
        this.showSuccessfulChecks = !this.showSuccessfulChecks;
    }

    public getMetaDataMarkdown(metaData: AppInsightQueryMetadata) {
        let str = "<pre>" + metaData.query + "</pre>";
        return str;
    }

    getApplicationInsightsData(response: DetectorResponse) {
        this.appInsightQueryMetaDataList = [];
        this.appInsightDataList = [];

        let appInsightDiagnosticData = response.dataset.filter(data => (<Rendering>data.renderingProperties).type === RenderingType.ApplicationInsightsView);

        appInsightDiagnosticData.forEach((diagnosticData: DiagnosticData) => {
            diagnosticData.table.rows.map(row => {
                this.appInsightQueryMetaDataList.push(<AppInsightQueryMetadata>{
                    title: row[0],
                    description: row[1],
                    query: row[2],
                    poralBladeInfo: row[3],
                    renderingProperties: row[4]
                });
            });
        });

        if (this.isPublic && this.appInsightQueryMetaDataList !== []) {
            this._appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
                if (loadStatus === true) {
                    this.loadingAppInsightsResource = false;
                    this.appInsightQueryMetaDataList.forEach(appInsightData => {
                        this._appInsightsService.ExecuteQuerywithPostMethod(appInsightData.query).subscribe(data => {
                            if (data && data["Tables"]) {
                                let rows = data["Tables"][0]["Rows"];
                                let columns = data["Tables"][0]["Columns"];
                                let dataColumns: DataTableResponseColumn[] = [];
                                columns.forEach(column => {
                                    dataColumns.push(<DataTableResponseColumn>{
                                        columnName: column.ColumnName,
                                        dataType: column.DataType,
                                        columnType: column.ColumnType,
                                    })
                                });

                                this.appInsightDataList.push(<AppInsightData>{
                                    title: appInsightData.title,
                                    description: appInsightData.description,
                                    renderingProperties: appInsightData.renderingProperties,
                                    poralBladeInfo: appInsightData.poralBladeInfo,
                                    diagnosticData: <DiagnosticData>{
                                        table: <DataTableResponseObject>{
                                            columns: dataColumns,
                                            rows: rows,
                                        },
                                        renderingProperties: appInsightData.renderingProperties,
                                    }
                                });
                            }

                            this.loadingAppInsightsQueryData = false;
                        });
                    });
                }
            });
        }
    }

    populateSupportTopicDocument() {
        if (!this.supportDocumentRendered) {
            this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
                if (res && res.length > 0) {
                    var htmlContent = res[0]["htmlContent"];
                    // Custom javascript code to remove top header from support document html string
                    var tmp = document.createElement("DIV");
                    tmp.innerHTML = htmlContent;
                    var h2s = tmp.getElementsByTagName("h2");
                    if (h2s && h2s.length > 0) {
                        h2s[0].remove();
                    }

                    // Set the innter html for support document display
                    this.supportDocumentContent = tmp.innerHTML;
                    this.supportDocumentRendered = true;
                }
            });
        }
    }

    isInCaseSubmission(): boolean {
        return !!this._supportTopicService && !!this._supportTopicService.supportTopicId && this._supportTopicService.supportTopicId != '';
    }

    getQueryParamsForAnalysisDetector(): string {
        let allRouteQueryParams = this._activatedRoute.snapshot.queryParams;
        let additionalQueryString = '';
        let knownQueryParams = ['startTime', 'endTime'];
        let queryParamsToSkipForAnalysisDetectors = ['startTimeChildDetector', 'endTimeChildDetector'];
        Object.keys(allRouteQueryParams).forEach(key => {
            if (knownQueryParams.indexOf(key) < 0) {
                if (queryParamsToSkipForAnalysisDetectors.indexOf(key) < 0) {
                    additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
                }
            }
        });
        return additionalQueryString;
    }

    analysisContainsDowntime(): Observable<boolean> {
        if (this.analysisId === 'searchResultsAnalysis') {
            return of(false);
        }
        return this._diagnosticService.getDetector(this.analysisId, this._detectorControl.startTimeString, this._detectorControl.endTimeString,
            false, this._detectorControl.isInternalView, this.getQueryParamsForAnalysisDetector()).pipe(
                map((response: DetectorResponse) => {
                    let downTimeRenderingType = response.dataset.find(set => (<Rendering>set.renderingProperties).type === RenderingType.DownTime);
                    if (!!downTimeRenderingType && !this.isInCaseSubmission()) {
                        //Allow downtimes only when not in case submission.
                        return true;
                    }
                    else {
                        return false;
                    }
                }),
                catchError(e => { return of(false) })
            );
    }

    refresh() {
        if (this.withinGenie) {
            this.detectorId = "";
            this.showAppInsightsSection = false;
            this.renderInsightsFromSearch(this._downTime);
        }
        else {
            this._activatedRoute.paramMap.subscribe(params => {
                this.analysisId = (this.analysisId != 'searchResultsAnalysis' && !!params.get('analysisId')) ? params.get('analysisId') : this.analysisId;
                this.detectorId = params.get(this.detectorParmName) === null ? "" : params.get(this.detectorParmName);
                if (this.detectorId == "" && !!this._activatedRoute.firstChild && this._activatedRoute.firstChild.snapshot && this._activatedRoute.firstChild.snapshot.paramMap.has(this.detectorParmName) && this._activatedRoute.firstChild.snapshot.paramMap.get(this.detectorParmName).length > 1) {
                    this.detectorId = this._activatedRoute.firstChild.snapshot.paramMap.get(this.detectorParmName);
                }
                if (this.analysisId != 'searchResultsAnalysis' && this.detectorId == "") this.goBackToAnalysis();
                this.populateSupportTopicDocument();
                this.analysisContainsDowntime().subscribe(containsDownTime => {
                    if ((containsDownTime && !!this._downTime) || !containsDownTime) {
                        let currDowntime = this._downTime;
                        this.resetGlobals();
                        if (this.analysisId === "searchResultsAnalysis") {
                            this._activatedRoute.queryParamMap.subscribe(qParams => {
                                this.resetGlobals();
                                this.searchTerm = qParams.get('searchTerm') === null ? this.searchTerm : qParams.get('searchTerm'); this.showAppInsightsSection = false;
                                if (this.searchTerm && this.searchTerm.length > 1) {
                                    this.isDynamicAnalysis = true;
                                    if (!!this.detectorId && this.detectorId !== '') {
                                        this.updateDrillDownMode(true, null);
                                        this._diagnosticService.getDetectors().subscribe(detectorList => {
                                            if (detectorList) {
                                                if (this.detectorId !== "") {
                                                    let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
                                                    this.detectorName = currentDetector.name;
                                                }
                                            }
                                        });
                                    }
                                    this.showSuccessfulChecks = false;
                                    this.renderInsightsFromSearch(currDowntime);
                                }
                            });
                        }
                        else {
                            // Add application insights analysis data
                            this._diagnosticService.getDetector(this.analysisId, this._detectorControl.startTimeString, this._detectorControl.endTimeString,
                                false, this._detectorControl.isInternalView, this.getQueryParamsForAnalysisDetector())
                                .subscribe((response: DetectorResponse) => {
                                    this.checkSearchEmbedded(response);
                                    this.getApplicationInsightsData(response);
                                });

                            this._diagnosticService.getDetectors().subscribe(detectorList => {
                                if (detectorList) {

                                    if (this.detectorId !== "") {
                                        let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
                                        this.detectorName = currentDetector.name;
                                        this.detectors = [];
                                        detectorList.forEach(element => {
                                            if (element.analysisTypes != null && element.analysisTypes.length > 0) {
                                                element.analysisTypes.forEach(analysis => {
                                                    if (analysis === this.analysisId) {
                                                        this.detectors.push({ name: element.name, id: element.id });
                                                        this.loadingMessages.push("Checking " + element.name);
                                                    }
                                                });
                                            }
                                        });
                                        this.startDetectorRendering(detectorList, currDowntime, containsDownTime);
                                        let currViewModel = {
                                            model: this.getDetectorViewModel(currentDetector, currDowntime, containsDownTime),
                                            insightTitle: '',
                                            insightDescription: ''
                                        };
                                        this.updateDrillDownMode(true, currViewModel);
                                        if (currViewModel.model.startTime != null && currViewModel.model.endTime != null) {
                                            this.analysisContainsDowntime().subscribe(containsDowntime => {
                                                if (containsDowntime) {
                                                    this._router.navigate([`./detectors/${currentDetector.id}`], {
                                                        relativeTo: this._activatedRoute,
                                                        queryParams: { startTimeChildDetector: currViewModel.model.startTime, endTimeChildDetector: currViewModel.model.endTime },
                                                        queryParamsHandling: 'merge',
                                                        replaceUrl: true
                                                    });
                                                }
                                                else {
                                                    this._router.navigate([`./detectors/${currentDetector.id}`], {
                                                        relativeTo: this._activatedRoute,
                                                        queryParams: { startTime: currViewModel.model.startTime, endTime: currViewModel.model.endTime },
                                                        queryParamsHandling: '',
                                                        replaceUrl: true
                                                    });
                                                }
                                            });
                                        }
                                        return;
                                    } else {
                                        this.detectorEventProperties = {
                                            'StartTime': String(this._detectorControl.startTime),
                                            'EndTime': String(this._detectorControl.endTime),
                                            'DetectorId': this.analysisId,
                                            'ParentDetectorId': "",
                                            'Url': window.location.href
                                        };
                                    }

                                    detectorList.forEach(element => {

                                        if (element.analysisTypes != null && element.analysisTypes.length > 0) {
                                            element.analysisTypes.forEach(analysis => {
                                                if (analysis === this.analysisId) {
                                                    this.detectors.push({ name: element.name, id: element.id });
                                                    this.loadingMessages.push("Checking " + element.name);
                                                }
                                            });
                                        }
                                    });

                                    this.startDetectorRendering(detectorList, currDowntime, containsDownTime);
                                }
                            });
                        }
                    }
                    else {
                        this.resetGlobals();
                    }
                });
            });
        }
    }



    renderInsightsFromSearch(downTime: DownTime) {
        this._resourceService.getPesId().subscribe(pesId => {
            if (!((this.isPublic && detectorSearchEnabledPesIds.findIndex(x => x == pesId) < 0) || (!this.isPublic && detectorSearchEnabledPesIdsInternal.findIndex(x => x == pesId) < 0))) {
                this.searchId = uuid();
                let searchTask = this._diagnosticService.getDetectorsSearch(this.searchTerm).pipe(map((res) => res), catchError(e => of([])));
                let detectorsTask = this._diagnosticService.getDetectors().pipe(map((res) => res), catchError(e => of([])));
                this.showPreLoader = true;
                observableForkJoin([searchTask, detectorsTask]).subscribe(results => {
                    this.showPreLoader = false;
                    this.showPreLoadingError = false;
                    var searchResults: DetectorMetaData[] = results[0];
                    this.logEvent(TelemetryEventNames.SearchQueryResults, {
                        searchMode: this.searchMode,
                        searchId: this.searchId,
                        query: this.searchTerm, results: JSON.stringify(searchResults.map((det: DetectorMetaData) => new Object({
                            id: det.id,
                            score: det.score
                        }))), ts: Math.floor((new Date()).getTime() / 1000).toString()
                    });
                    var detectorList = results[1];
                    if (detectorList) {
                        searchResults.forEach(result => {
                            if (result.type === DetectorType.Detector) {
                                this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
                            }
                            else if (result.type === DetectorType.Analysis) {
                                var childList = this.getChildrenOfAnalysis(result.id, detectorList);
                                if (childList && childList.length > 0) {
                                    childList.forEach((child: DetectorMetaData) => {
                                        this.insertInDetectorArray({ name: child.name, id: child.id, score: result.score });
                                    });
                                }
                                else {
                                    this.insertInDetectorArray({ name: result.name, id: result.id, score: result.score });
                                }
                            }
                        });
                        this.analysisContainsDowntime().subscribe(containsDownTime => {
                            this.startDetectorRendering(detectorList, downTime, containsDownTime);
                        });

                    }
                },
                    (err) => {
                        this.showPreLoader = false;
                        this.showPreLoadingError = true;
                    });
            }
            else {
                if (this.withinGenie) {

                    let dataOutput = {};
                    dataOutput["status"] = true;
                    dataOutput["data"] = {
                        'detectors': []
                    };

                    this.onComplete.emit(dataOutput);

                }
            }
        });
    }

    checkSearchEmbedded(response: DetectorResponse) {
        response.dataset.forEach((ds: DiagnosticData) => {
            if (ds.renderingProperties.type === RenderingType.SearchComponent) {
                this.searchDiagnosticData = ds;
                this.isSearchEmbedded = true;
                this.showSuccessfulChecks = false;
            }
            else {
                this.isSearchEmbedded = false;
                this.showSuccessfulChecks = true;
            }
        });
    }

    evaluateAndEmitDowntimeInteractionState(analysisContainsDownTime: boolean, totalChildDetectorsToLoad: number, zoomBehavior: zoomBehaviors, incrementTotalDetectorsLoadedCount: boolean = true) {
        if (analysisContainsDownTime) {
            if ((zoomBehavior & zoomBehaviors.ShowXAxisSelectionDisabledMessage) || (zoomBehavior & zoomBehaviors.GeryOutGraph)) {
                this.updateDowntimeZoomBehavior.emit(zoomBehavior);
                this.totalChildDetectorsLoaded = 0;
                this.allowUpdateDowntimeZoomBehaviorEvent = true;
                this.timeWhenAnalysisStarted = moment.utc();

                //If a new anaysis is started, we need to get rid of the earlier timer
                if (!!this.downtimeResetTimer) { clearTimeout(this.downtimeResetTimer); }
                this.downtimeResetTimer = setTimeout(() => {
                    //Adding this to reset zoom behavior once the timeout expires.
                    this.updateDowntimeZoomBehavior.emit(zoomBehaviors.CancelZoom | zoomBehaviors.FireXAxisSelectionEvent | zoomBehaviors.UnGreyGraph);
                    this.allowUpdateDowntimeZoomBehaviorEvent = false;
                }, WAIT_TIME_IN_SECONDS_TO_ALLOW_DOWNTIME_INTERACTION * 1000);
            }
            else {
                if (incrementTotalDetectorsLoadedCount) {
                    this.totalChildDetectorsLoaded < totalChildDetectorsToLoad ? this.totalChildDetectorsLoaded++ : this.totalChildDetectorsLoaded = totalChildDetectorsToLoad;
                }

                if (this.totalChildDetectorsLoaded / totalChildDetectorsToLoad >= PERCENT_CHILD_DETECTORS_COMPLETED_TO_ALLOW_DOWNTIME_INTERACTION
                    && this.allowUpdateDowntimeZoomBehaviorEvent === true) {
                    this.updateDowntimeZoomBehavior.emit(zoomBehavior);
                    this.allowUpdateDowntimeZoomBehaviorEvent = false;
                }
            }
        }
    }

    startDetectorRendering(detectorList, downTime: DownTime, containsDownTime: boolean) {
        if (this.showWebSearchTimeout) {
            clearTimeout(this.showWebSearchTimeout);
        }
        this.showWebSearchTimeout = setTimeout(() => { this.showWebSearch = true; }, 3000);
        this.issueDetectedViewModels = [];
        const requests: Observable<any>[] = [];

        this.detectorMetaData = detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
        this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, downTime, containsDownTime));
        if (this.detectorViewModels.length > 0) {
            this.loadingChildDetectors = true;
            this.startLoadingMessage();
            this.evaluateAndEmitDowntimeInteractionState(containsDownTime, this.detectorViewModels.length, zoomBehaviors.CancelZoom | zoomBehaviors.ShowXAxisSelectionDisabledMessage | zoomBehaviors.GeryOutGraph, false);
        }
        this.detectorViewModels.forEach((metaData, index) => {
            requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
                map((response: DetectorResponse) => {
                    this.evaluateAndEmitDowntimeInteractionState(containsDownTime, this.detectorViewModels.length, zoomBehaviors.CancelZoom | zoomBehaviors.FireXAxisSelectionEvent | zoomBehaviors.UnGreyGraph);
                    this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);

                    if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
                        if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };

                            if (this.issueDetectedViewModels.length > 0) {
                                this.issueDetectedViewModels = this.issueDetectedViewModels.filter(iVM => (!!iVM.model && !!iVM.model.metadata && !!iVM.model.metadata.id && iVM.model.metadata.id != issueDetectedViewModel.model.metadata.id));
                            }

                            this.issueDetectedViewModels.push(issueDetectedViewModel);
                            this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => n1.model.status - n2.model.status);
                        } else {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };

                            if (this.successfulViewModels.length > 0) {
                                this.successfulViewModels = this.successfulViewModels.filter(sVM => (!!sVM.model && !!sVM.model.metadata && !!sVM.model.metadata.id && sVM.model.metadata.id != successViewModel.model.metadata.id));
                            }

                            this.successfulViewModels.push(successViewModel);
                        }
                    }

                    return {
                        'ChildDetectorName': this.detectorViewModels[index].title,
                        'ChildDetectorId': this.detectorViewModels[index].metadata.id,
                        'ChildDetectorStatus': this.detectorViewModels[index].status,
                        'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
                    };
                })
                , catchError(err => {
                    this.evaluateAndEmitDowntimeInteractionState(containsDownTime, this.detectorViewModels.length, zoomBehaviors.CancelZoom | zoomBehaviors.FireXAxisSelectionEvent | zoomBehaviors.UnGreyGraph);
                    if (this.detectorViewModels[index] != null) {
                        this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
                    }
                    const viewModel = this.detectorViewModels[index];
                    if (viewModel && viewModel.title) {
                        this.failedLoadingViewModels.push({
                            model: viewModel
                        });
                    }
                    return of({});
                })
            ));
        });

        // Log all the children detectors
        observableForkJoin(requests).subscribe(childDetectorData => {
            setTimeout(() => {
                let dataOutput = {};
                dataOutput["status"] = true;
                dataOutput["data"] = {
                    'searchMode': this.searchMode,
                    'detectors': this.detectors,
                    'successfulViewModels': this.successfulViewModels,
                    'issueDetectedViewModels': this.issueDetectedViewModels
                };

                this.onComplete.emit(dataOutput);
            }, 10);

            this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
            if (this.searchId && this.searchId.length > 0) {
                this.childDetectorsEventProperties['SearchId'] = this.searchId;
            }
            this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
        });

        if (requests.length === 0) {
            let dataOutput = {};
            dataOutput["status"] = true;
            dataOutput["data"] = {
                'detectors': []
            };

            this.onComplete.emit(dataOutput);
        }
    }

    getChildrenOfAnalysis(analysisId, detectorList) {
        return detectorList.filter(element => (element.analysisTypes != null && element.analysisTypes.length > 0 && element.analysisTypes.findIndex(x => x == analysisId) >= 0)).map(element => { return { name: element.name, id: element.id }; });
    }

    insertInDetectorArray(detectorItem) {
        if (this.withinGenie) {
            if (this.detectors.findIndex(x => x.id === detectorItem.id) < 0 && detectorItem.score >= this.targetedScore) {
                this.detectors.push(detectorItem);
                this.loadingMessages.push("Checking " + detectorItem.name);
            }
        }
        else if (this.detectors.findIndex(x => x.id === detectorItem.id) < 0) {
            this.detectors.push(detectorItem);
            this.loadingMessages.push("Checking " + detectorItem.name);
        }
    }

    getPendingDetectorCount(): number {
        let pendingCount = 0;
        if (this.detectorViewModels) {
            this.detectorViewModels.forEach((metaData, index) => {
                if (this.detectorViewModels[index].loadingStatus == LoadingStatus.Loading) {
                    ++pendingCount;
                }
            });
        }
        return pendingCount;
    }

    resetGlobals() {
        this.detectors = [];
        this.detectorViewModels = [];
        this.issueDetectedViewModels = [];
        this.loadingChildDetectors = false;
        this.allSolutions = [];
        this.loadingMessages = [];
        this.successfulViewModels = [];
        this.showWebSearch = false;
        this.isSearchEmbedded = false;
        this.downTime = null;
    }

    getDetectorInsight(viewModel: any): any {
        let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(viewModel.response, true);
        let insight: any;
        if (allInsights.length > 0) {

            let detectorInsight = allInsights.find(i => i.status === viewModel.status);
            if (detectorInsight == null) {
                detectorInsight = allInsights[0];
            }

            let description = null;
            if (detectorInsight.hasData()) {
                description = detectorInsight.data["Description"];
            }
            insight = { title: detectorInsight.title, description: description };

            // now populate solutions for all the insights
            const solutions: Solution[] = [];
            allInsights.forEach(i => {
                if (i.solutions != null && i.solutions.length > 0) {
                    i.solutions.forEach(s => {
                        if (solutions.findIndex(x => x.Name === s.Name) === -1) {
                            solutions.push(s);
                        }
                    });
                    this.allSolutionsMap.set(viewModel.title, solutions);
                }
            });
        }
        return insight;
    }

    private updateDetectorViewModelSuccess(viewModel: any, res: DetectorResponse) {
        const status = res.status.statusId;

        viewModel.loadingStatus = LoadingStatus.Success,
            viewModel.status = status;
        viewModel.statusColor = StatusStyles.getColorByStatus(status),
            viewModel.statusIcon = StatusStyles.getIconByStatus(status),
            viewModel.response = res;
        return viewModel;
    }

    private getDetectorViewModel(detector: DetectorMetaData, downtime: DownTime, containsDownTime: boolean) {
        let startTimeString = this._detectorControl.startTimeString;
        let endTimeString = this._detectorControl.endTimeString;

        if (containsDownTime && !!downtime && !!downtime.StartTime && !!downtime.EndTime) {
            startTimeString = downtime.StartTime.format(this.stringFormat);
            endTimeString = downtime.EndTime.format(this.stringFormat);
        }

        return {
            title: detector.name,
            metadata: detector,
            loadingStatus: LoadingStatus.Loading,
            startTime: startTimeString,
            endTime: endTimeString,
            status: null,
            statusColor: null,
            statusIcon: null,
            expanded: false,
            response: null,
            request: this._diagnosticService.getDetector(detector.id, startTimeString, endTimeString, false, this._detectorControl.isInternalView, this.getQueryParamsForAnalysisDetector())
        };
    }

    public openBladeDiagnoseDetectorId(category: string, detector: string, type: DetectorType = DetectorType.Detector) {
        const bladeInfo = {
            title: category,
            detailBlade: 'SCIFrameBlade',
            extension: 'WebsitesExtension',
            detailBladeInputs: {
                id: this.resourceId,
                categoryId: category,
                optionalParameters: [{
                    key: "categoryId",
                    value: category
                },
                {
                    key: "detectorId",
                    value: detector
                },
                {
                    key: "detectorType",
                    value: type
                }]
            }
        };
        this._solutionService.GoToBlade(this.resourceId, bladeInfo);

    }

    public navigateToDetector(): void {
        if (!this.isPublic) {
            if (!!this.drillDownDetectorId && this.drillDownDetectorId.length > 0) {
                this._router.navigate([`./popout/${this.drillDownDetectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
            }
        }
    }

    public goBackToAnalysis(): void {
        this.updateDrillDownMode(false, null);
        if (this.analysisId === "searchResultsAnalysis" && this.searchTerm) {
            this._router.navigate([`../../../../${this.analysisId}/search`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', queryParams: { searchTerm: this.searchTerm } });
        }
        else {
            if (!!this.analysisId && this.analysisId.length > 0) {
                this._router.navigate([`../${this.analysisId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
            }
        }
    }

    private updateDrillDownMode(inDrillDownMode: boolean, viewModel: any): void {
        this.inDrillDownMode = inDrillDownMode;
        if (!this.inDrillDownMode) {
            this.detectorName = '';
            this.drillDownDetectorId = '';
        }
        else {
            if (!!viewModel && !!viewModel.model && !!viewModel.model.metadata && !!viewModel.model.metadata.name) {
                this.detectorName = viewModel.model.metadata.name;
                this.drillDownDetectorId = viewModel.model.metadata.id;
            }
        }
    }

    public selectDetector(viewModel: any) {
        if (viewModel != null && viewModel.model.metadata.id) {
            let detectorId = viewModel.model.metadata.id;
            let categoryName = "";
            const queryParams = this._activatedRoute.snapshot.queryParams;
            if (viewModel.model.metadata.category) {
                categoryName = viewModel.model.metadata.category.replace(/\s/g, '');
            }
            else {
                // For uncategorized detectors:
                // If it is home page, redirect to availability category. Otherwise stay in the current category page.
                categoryName = this._router.url.split('/')[11] ? this._router.url.split('/')[11] : "availabilityandperformance";
            }

            if (detectorId !== "") {
                const clickDetectorEventProperties = {
                    'ChildDetectorName': viewModel.model.title,
                    'ChildDetectorId': viewModel.model.metadata.id,
                    'IsExpanded': true,
                    'Status': viewModel.model.status,
                    'SearchMode': this.searchMode
                };

                // Log children detectors click
                this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);

                if (this.analysisId === "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length > 0) {
                    //If in homepage then open second blade for Diagnostic Tool and second blade will continue to open third blade for
                    if (this.withinGenie) {
                        const isHomepage = !(!!this._activatedRoute.root.firstChild && !!this._activatedRoute.root.firstChild.firstChild && !!this._activatedRoute.root.firstChild.firstChild.firstChild && !!this._activatedRoute.root.firstChild.firstChild.firstChild.firstChild && !!this._activatedRoute.root.firstChild.firstChild.firstChild.firstChild.firstChild && !!this._activatedRoute.root.firstChild.firstChild.firstChild.firstChild.firstChild.snapshot && !!this._activatedRoute.root.firstChild.firstChild.firstChild.firstChild.firstChild.snapshot.params["category"]);
                        if (detectorId == 'appchanges' && !this._detectorControl.internalClient) {
                            this.portalActionService.openChangeAnalysisBlade(this._detectorControl.startTimeString, this._detectorControl.endTimeString);
                            return;
                        }
                        if (isHomepage) {
                            this.openBladeDiagnoseDetectorId(categoryName, detectorId, DetectorType.Detector);
                        }
                        else {
                            this.logEvent(TelemetryEventNames.SearchResultClicked, { searchMode: this.searchMode, searchId: this.searchId, detectorId: detectorId, rank: 0, title: clickDetectorEventProperties.ChildDetectorName, status: clickDetectorEventProperties.Status, ts: Math.floor((new Date()).getTime() / 1000).toString() });
                            let dest = `resource${this.resourceId}/categories/${categoryName}/detectors/${detectorId}`;
                            this._globals.openGeniePanel = false;
                            this._router.navigate([dest]);
                        }
                    }
                    else {
                        // Case submission flow search result navigation
                        this.logEvent(TelemetryEventNames.SearchResultClicked, { searchMode: this.searchMode, searchId: this.searchId, detectorId: detectorId, rank: 0, title: clickDetectorEventProperties.ChildDetectorName, status: clickDetectorEventProperties.Status, ts: Math.floor((new Date()).getTime() / 1000).toString() });
                        let dest = `../../../analysis/${this.analysisId}/search/detectors/${detectorId}`;
                        if (this._activatedRoute.snapshot.paramMap.has("detectorName"))
                        {
                            dest = `../${detectorId}`;
                        }
                        this._router.navigate([dest], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm } });
                    }
                }
                else {
                    if (detectorId === 'appchanges' && !this._detectorControl.internalClient) {
                        this.portalActionService.openChangeAnalysisBlade(this._detectorControl.startTimeString, this._detectorControl.endTimeString);
                    } else {
                        //TODO, For D&S blade, need to add a service to find category and navigate to detector
                        if (viewModel.model.startTime != null && viewModel.model.endTime != null) {
                            this._detectorControl.setCustomStartEnd(viewModel.model.startTime, viewModel.model.endTime);
                            //Todo, detector control service should able to read and infer TimePickerOptions from startTime and endTime
                            this._detectorControl.updateTimePickerInfo({
                                selectedKey: TimePickerOptions.Custom,
                                selectedText: TimePickerOptions.Custom,
                                startDate: new Date(viewModel.model.startTime),
                                endDate: new Date(viewModel.model.endTime)
                            });
                            this.updateBreadcrumb();

                            //Remove queryParams startTimeChildDetector and endTimeChildDetector. Update startTime and endTime to downtime period
                            const updatedParams = { ...queryParams };
                            delete updatedParams["startTimeChildDetector"];
                            delete updatedParams["endTimeChildDetector"];
                            updatedParams["startTime"] = viewModel.model.startTime;
                            updatedParams["endTime"] = viewModel.model.endTime;

                            this._router.navigate([`../../detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParams: updatedParams });
                        }
                        else {
                            this.updateBreadcrumb();
                            this._router.navigate([`../../detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true });
                        }
                    }
                }
            }
        }
    }

    linkStyle: ILinkProps['styles'] = {
        root: {
            padding: '10px'
        }
    }

    public selectDetectorNewTab(viewModel: any) {
        if (viewModel != null && viewModel.model.metadata.id) {
            let detectorId = viewModel.model.metadata.id;
            const queryParams = this._activatedRoute.snapshot.queryParams;

            if (detectorId !== "") {
                let paramString = "";
                Object.keys(queryParams).forEach(x => {
                    paramString = paramString === "" ? `${paramString}${x}=${queryParams[x]}` : `${paramString}&${x}=${queryParams[x]}`;
                });
                const linkAddress = `${this._router.url.split('/analysis/')[0]}/detectors/${detectorId}?${paramString}`;

                window.open(linkAddress, '_blank');
            }
        }
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };
        let segments: string[] = [path];
        this._router.navigate(segments, navigationExtras);
    }

    startLoadingMessage(): void {
        let self = this;
        this.loadingMessageIndex = 0;
        this.showLoadingMessage = true;

        setTimeout(() => {
            self.showLoadingMessage = false;
        }, 3000)
        this.loadingMessageTimer = setInterval(() => {
            self.loadingMessageIndex++;
            self.showLoadingMessage = true;

            if (self.loadingMessageIndex === self.loadingMessages.length - 1) {
                clearInterval(this.loadingMessageTimer);
                return;
            }

            setTimeout(() => {
                self.showLoadingMessage = false;
            }, 3000)
        }, 4000);
    }

    openSolutionPanel(viewModel: any) {
        if (viewModel != null && viewModel.model != null && viewModel.model.title) {
            let title: string = viewModel.model.title;
            let detectorId: string = (viewModel.model.metadata != null) && (viewModel.model.metadata.id != null) ? viewModel.model.metadata.id : "";
            let status: string = viewModel.model.status != null ? JSON.stringify(viewModel.model.status) : "";
            this.allSolutions = this.allSolutionsMap.get(title);
            this.solutionTitle = title;
            this.solutionPanelOpenSubject.next(true);
            this.logEvent("ViewSolutionPanelButtonClicked", {
                SolutionTitle: title,
                DetectorId: detectorId,
                Status: status,
                SearchMode: this.searchMode
            });
        }
    }

    private updateBreadcrumb() {
        if (this.isPublic || this.withinGenie) return;

        const queryParams = this._activatedRoute.snapshot.queryParams;
        this._genericBreadcrumbService.updateBreadCrumbSubject({
            name: this.analysisName,
            id: this.analysisId,
            isDetector: false,
            queryParams: queryParams
        });
    }
}

