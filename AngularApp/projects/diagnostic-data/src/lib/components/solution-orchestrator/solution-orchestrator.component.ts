import { Moment } from 'moment';
import { v4 as uuid } from 'uuid';
import { Component, OnInit, Input, Inject, EventEmitter, Output } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { LoadingStatus } from '../../models/loading';
import { StatusStyles } from '../../models/styles';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Solution } from '../solution/solution';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { forkJoin as observableForkJoin, Observable, of } from 'rxjs';
import { map, catchError, delay, retryWhen } from 'rxjs/operators';
import { DetectorResponse, DetectorMetaData, HealthStatus, DetectorType, DownTime } from '../../models/detector';
import { Insight, InsightUtils } from '../../models/insight';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import {RenderingMode} from "../../models/solution-orchestrator";
import { SearchAnalysisMode } from '../../models/search-mode';
import { GenieGlobals } from '../../services/genie.service';
import { SolutionService } from '../../services/solution.service';
import { PortalActionGenericService } from '../../services/portal-action.service';
import {detectorSearchEnabledPesIds, detectorSearchEnabledPesIdsInternal } from '../../models/search';
import { GenericResourceService } from '../../services/generic-resource-service';
import { WebSearchConfiguration } from '../../models/search';
import { GenericContentService } from '../../services/generic-content.service';
import {PanelType} from "office-ui-fabric-react";

@Component({
    selector: 'solution-orchestrator',
    templateUrl: './solution-orchestrator.component.html',
    styleUrls: ['./solution-orchestrator.component.scss'],
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
export class SolutionOrchestratorComponent extends DataRenderBaseComponent implements OnInit {
    @Input() renderMode: RenderingMode = RenderingMode.CaseSubmission;
    @Input() searchMode: SearchAnalysisMode = SearchAnalysisMode.CaseSubmission;
    @Input() resourceId: string = "";
    @Input() searchTerm: string = "";
    @Input() detectorThresholdScore: number = 0.5;
    @Input() articlesThresholdScore: number = 0.5;
    @Output() onComplete = new EventEmitter<any>();
    @Input() keystoneSolutionView: boolean = false;
    inputAriaLabel: string = "Short description of the issue";
    time: string = "";
    detectorViewModels: any[];
    detectorMetaData: DetectorMetaData[];
    private childDetectorsEventProperties = {};
    targetedScore: number = 0.5;
    webSearchConfig: any = null;
    pesId: string = null;

    searchTermDisplayed: string = "";
    fetchingDetectors: boolean = false;

    topLevelSolutions = [];

    issueDetectedViewModels: any[] = [];
    successfulViewModels: any[] = [];
    webDocuments = [];

    detectorList: any[] = [];

    documentsShowLoader = false;
    azureGuidesShowLoader = false;

    detectors: any[] = [];

    breadcrumbItems: any[] = [];

    isPanelOpen: boolean = false;
    panelType = PanelType.medium;
    closePanel() {this.isPanelOpen = false;}
    panelHeaderText = "";
    panelSolutions: any[] = [];
    showPanel(solutions, headerText) {this.panelSolutions = solutions; this.panelHeaderText = headerText; this.isPanelOpen = true;}
    showSolutions(viewModel) {
        this.telemetryService.logEvent(TelemetryEventNames.SolutionOrchestratorViewSolutionsClicked, {searchId: this.searchId, insightTitle: viewModel.insightTitle, detectorId: viewModel.model.metadata.id, score: viewModel.score, ts: Math.floor((new Date()).getTime() / 1000).toString()});
        this.showPanel(viewModel.solutions!=null? viewModel.solutions: [], `${viewModel.model.metadata.name} solutions`);
    }

    mainSolutionIndex = 0;

    allSolutions: Solution[] = [];

    timeoutToShowSolutions: number = 10000;
    showSolutionsTimedout: boolean = false;

    startTime: Moment;
    endTime: Moment;
    isPublic: boolean;

    /*numArticlesExpanded: number = 3;
    articleSectionExpanded: boolean = false;
    toggleArticleSection = () => {
        this.articleSectionExpanded = !this.articleSectionExpanded;
        if (this.articleSectionExpanded) {
            this.logEvent(TelemetryEventNames.MoreWebResultsClicked,
                {
                    searchId: this.searchId,
                    searchTerm: this.searchTerm,
                    ts: Math.floor((new Date()).getTime() / 1000).toString()
                }
            );
        }
    };*/

    documentationSectionIcon: any = {
        iconName: "FileASPX",
        styles: {
            root: {
                marginLeft: "11px",
                fontSize: "16px"
            }
        }
    };
    observationSectionIcon: any = {
        iconName: "StatusErrorFull",
        styles: {
            root: {
                color: "#A4262C",
                marginLeft: "11px",
                fontSize: "16px"
            }
        }
    };
    successfulSectionIcon: any = {
        iconName: "SkypeCircleCheck",
        styles: {
            root: {
                color: "#57A300",
                marginLeft: "11px",
                fontSize: "16px"
            }
        }
    }

    supportDocumentContent: string = "";
    supportDocumentRendered: boolean = false;
    searchId: string = null;
    readonly stringFormat: string = 'YYYY-MM-DDTHH:mm';
    public inDrillDownMode: boolean = false;
    drillDownDetectorId: string = '';

    linkStyle = {
        root: {
            marginTop: '12px',
            marginLeft: '20px',
            fontSize: '13px'
        }
    };

    successfulLinkStyle = {
        root: {
            margin: '10px 0px 2px 2px',
            fontSize: '13px'
        }
    };

    solutionButtonStyle = {
        root: {
            //marginTop: '10px',
            verticalAlign: "middle",
            height: '25px',
            fontSize: '13px',
            paddingBottom: '2px'
        }
    };

    breadCrumbStyle = {
        root: {
            marginTop: "0px"
        },
        item: {
            fontWeight: "400 !important"
        },
        itemLink: {
            fontWeight: "400 !important"
        }
    };

    selectSolution(sol, i) {
        this.mainSolutionIndex = i;
        this.telemetryService.logEvent(TelemetryEventNames.SolutionOrchestratorOptionSelected, {searchId: this.searchId, solutionTitle: sol.Title, solutionScore: sol.Score, solutionDetector: sol.DetectorId, solutionIndex: i, ts: Math.floor((new Date()).getTime() / 1000).toString()});
    }

    constructor(public _activatedRoute: ActivatedRoute, private _router: Router,
        private _diagnosticService: DiagnosticService, private _detectorControl: DetectorControlService,
        protected telemetryService: TelemetryService, public _appInsightsService: AppInsightsQueryService,
        private _supportTopicService: GenericSupportTopicService, protected _globals: GenieGlobals, private _solutionService: SolutionService,
        @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private portalActionService: PortalActionGenericService, private _resourceService: GenericResourceService, private _contentService: GenericContentService,) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;

        if (this.isPublic) {
            this.getPesId();
        }
    }

    public _downTime: DownTime = null;
    @Input()
    set downTime(downTime: DownTime) {
        if (!!downTime && !!downTime.StartTime && !!downTime.EndTime) {
            this._downTime = downTime;
        }
        else {
            this._downTime = null;
        }
    }

    //Utility functions
    selectResult(doc: any) {
        window.open(doc.link, '_blank');
        this.logEvent(TelemetryEventNames.WebQueryResultClicked, { searchId: this.searchId, article: JSON.stringify(doc), ts: Math.floor((new Date()).getTime() / 1000).toString() });
    }

    getLinkText(link: string) {
        return !link || link.length < 20 ? link : link.substr(0, 25) + '...';
    }

    getChildrenOfAnalysis(analysisId, detectorList) {
        return detectorList.filter(element => (element.analysisTypes != null && element.analysisTypes.length > 0 && element.analysisTypes.findIndex(x => x == analysisId) >= 0)).map(element => { return { name: element.name, id: element.id }; });
    }

    clearInsights() {
        this.showSolutionsTimedout = false;
        this.detectorViewModels = [];
        this.issueDetectedViewModels = [];
        this.successfulViewModels = [];
        this.allSolutions = [];
        this.topLevelSolutions = [];
        this.mainSolutionIndex = 0;
    }

    resetGlobals() {
        this.detectors = [];
        this.clearInsights();
        this.inDrillDownMode = false;
    }

    ngOnInit() {
        this.getAzureGuides();
        this._activatedRoute.paramMap.subscribe(params => {
            let detectorId = params.get("detectorName") === null ? null : params.get("detectorName");
            if (detectorId && detectorId.length>0) {
                this.drillDownDetectorId = detectorId;
                this.inDrillDownMode = true;
            }
            else {
                this.drillDownDetectorId = null;
                this.inDrillDownMode = false;
                this._activatedRoute.queryParamMap.subscribe(qParams => {
                    let searchTerm = qParams.get('searchTerm') === null ? null : qParams.get('searchTerm');
                    if (searchTerm && searchTerm.length>1 && searchTerm != this.searchTerm) {
                        this.searchTerm = searchTerm;
                        this.searchTermDisplayed = this.searchTerm;
                        this.hitSearch();
                    }
                    else if (this.startTime !== this._detectorControl.startTime || this.endTime !== this._detectorControl.endTime) {
                        this.timeRefresh();
                    }
                });
            }
        });
    }

    timeRefresh() {
        this.clearInsights();
        this.startDetectorRendering(null, false);
    }

    updateSearchTerm(searchValue: { newValue: any }) {
        if (!!searchValue && !!searchValue.newValue && !!searchValue.newValue.currentTarget && !!searchValue.newValue.currentTarget.value) {
            this.searchTermDisplayed = searchValue.newValue.currentTarget.value;
        }
    }

    getPesId(){
        this._resourceService.getPesId().subscribe(pesId => {
            this.pesId = pesId;
        });
    }

    onSearchBoxFocus(){}

    // Below two methods are for new version of time picker
    /*updateMessage(s: string) {
        this.time = s;
    }*/

    /*toggleOpenTimePicker() {
        //this.globals.openTimePicker = !this.globals.openTimePicker;
        //this.updateAriaExpanded();
    }*/

    sendFeedback() {
        this.portalActionService.openFeedbackPanel();
    }

    getAzureGuides() {
        if (!this.supportDocumentRendered) {
            this.azureGuidesShowLoader = true;
            this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
                this.azureGuidesShowLoader = false;
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
            }, (err) => {
                this.azureGuidesShowLoader = false;
            });
        }
    }

    getBingSearchTask(preferredSites:string[]) {
        return this._contentService.searchWeb(this.searchTerm, this.webSearchConfig.MaxResults.toString(), this.webSearchConfig.UseStack, preferredSites, this.webSearchConfig.ExcludedSites).pipe(map((res) => res), retryWhen(errors => {
            let numRetries = 0;
            return errors.pipe(delay(1000), map(err => {
                if (numRetries++ === 3) {
                    throw err;
                }
                return err;
            }));
        }), catchError(e => {
            throw e;
        }));
    }

    getDocuments() {
        if (!this.webSearchConfig) {
            this.webSearchConfig = new WebSearchConfiguration(this.pesId);
        }
        var searchTask;
        let searchTaskComplete = false;
        let searchTaskPrefsComplete = false;
        let searchTaskPrefs = null;
        let searchTaskResult = null;
        let searchTaskPrefsResult = null;
        // make call to bing search
        var preferredSites = [];
        searchTask = this.getBingSearchTask(preferredSites);
        if (this.webSearchConfig && this.webSearchConfig.PreferredSites && this.webSearchConfig.PreferredSites.length>0) {
            searchTaskPrefs = this.getBingSearchTask(this.webSearchConfig.PreferredSites);
        }
        else {
            searchTaskPrefsComplete = true;
        }
        let postFinish = () => {
            if (searchTaskComplete && searchTaskPrefsComplete) {
                let webresults = this.mergeBingResults([searchTaskResult, searchTaskPrefsResult]);
                this.displayWebResults(webresults);
            }
        }
        this.documentsShowLoader = true;
        searchTask.subscribe(res => {
            searchTaskResult = res;
            searchTaskComplete = true;
            postFinish();
        }, (err)=> {
            searchTaskResult = null;
            searchTaskComplete = true;
            postFinish();
        });
        if (searchTaskPrefs) {
            searchTaskPrefs.subscribe(res => {
                searchTaskPrefsResult = res;
                searchTaskPrefsComplete = true;
                postFinish();
            }, (err)=> {
                searchTaskPrefsResult = null;
                searchTaskPrefsComplete = true;
                postFinish();
            });
        }
    }

    displayWebResults(results) {
        this.documentsShowLoader = false;
        if (results && results.webPages && results.webPages.value && results.webPages.value.length > 0) {

            var webSearchResults = results.webPages.value;
            this.webDocuments = webSearchResults.map(result => {
                return {
                    title: result.name,
                    description: result.snippet,
                    link: result.url,
                    linkShort: this.getLinkText(result.url),
                    articleSurfacedBy : result.resultSurfacedBy || "Bing"
                };
            });
            this.webDocuments = this.rankResultsBySource(this.webDocuments);
            this.logEvent(TelemetryEventNames.WebQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(this.webDocuments.map(result => {
                return {
                    title: result.title.replace(";"," "),
                    description: result.description.replace(";", " "),
                    link: result.link,
                    articleSurfacedBy : result.articleSurfacedBy || "Bing"
                };
            })), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        }
    }

    rankResultsBySource(resultsList) {
        if (!resultsList || resultsList.length == 0) {
            return [];
        }
        var seenSources = {};
        var part1 = [];
        var part2 = [];
        resultsList.forEach(item => {
            let itemUrl = new URL(item.link);
            let itemSource = itemUrl.hostname;
            if (seenSources.hasOwnProperty(itemSource)) {
                if (seenSources[itemSource]>2)
                part2.push(item);
                else
                {
                    part1.push(item);
                    seenSources[itemSource]++;
                }
            }
            else {
                part1.push(item);
                seenSources[itemSource] = 1;
            }
        });
        return part1.concat(part2);
    }

    mergeBingResults(results) {
        var finalResults = results[0];
        if (!(finalResults && finalResults.webPages && finalResults.webPages.value && finalResults.webPages.value.length > 0)) {
            finalResults = {
                webPages: {
                    value: []
                }
            };
        }
        if (results.length>1) {
            if (results[1] && results[1].webPages && results[1].webPages.value && results[1].webPages.value.length > 0) {
                results[1].webPages.value.forEach(result => {
                    var idx = finalResults.webPages.value.findIndex(x => x.url==result.url);
                    if (idx<0) {
                        finalResults.webPages.value.push(result);
                    }
                });
            }
        }
        return finalResults;
    }

    onSearchEnter(searchValue: { newValue: string }) {
        let searchTerm = searchValue.newValue;
        if (searchTerm !== this.searchTerm) {
            this._router.navigate([`../solutionorchestrator`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: searchTerm, hideShieldComponent: true } });
        }
    }

    clearSearchTerm() {
        this.searchTermDisplayed = "";
    }

    hitSearch() {
        this.resetGlobals();
        var detectorsTask = this.searchDetectors();
        var webDocuments = this.getDocuments();
    }

    insertInDetectorArray(detectorItem) {
        if (this.detectors.findIndex(x => x.id === detectorItem.id) < 0) {
            this.detectors.push(detectorItem);
        }
    }

    getDetectorNameById(detectorId) {
        let detector = this.detectorList.find(x => x.id == detectorId);
        if (detector) {
            return detector.name;
        }
        return null;
    }

    viewSolutionSupportingData(solution: Solution) {
        let detectorId = solution.DetectorId;
        let detectorName = this.getDetectorNameById(detectorId);
        this.breadcrumbItems = [
            {text: "Solutions", key: "mainSolutions", onClick: () => this.goBackToOrchestrator()},
            {text: detectorName? detectorName: solution.Title, key: detectorId}
        ];
        this.telemetryService.logEvent(TelemetryEventNames.SolutionOrchestratorViewSupportingDataClicked, {searchId: this.searchId, detectorId: detectorId, score: solution.Score.toString(), solutionTitle: solution.Title, solutionIndex: this.mainSolutionIndex.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString()});
        if (detectorId) {
            this._router.navigate([`../solutionorchestrator/detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm, hideShieldComponent: true } });
            this.inDrillDownMode = true;
        }
    }

    viewDetectorData(viewModel, tabName) {
        let detectorId = null;
        if (viewModel != null && viewModel.model.metadata.id) {
            detectorId = viewModel.model.metadata.id;
            this.telemetryService.logEvent(TelemetryEventNames.SolutionOrchestratorViewSupportingDataClicked, {searchId: this.searchId, detectorId: detectorId, insightTitle: viewModel.insightTitle, insightStatus: viewModel.model.status, score: viewModel.score, ts: Math.floor((new Date()).getTime() / 1000).toString()});
            this.breadcrumbItems = [
                {text: tabName, key: tabName, onClick: () => this.goBackToOrchestrator()},
                {text: viewModel.model.metadata.name, key: viewModel.model.metadata.id}
            ];
        }
        if (detectorId) {
            this._router.navigate([`../solutionorchestrator/detectors/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm, hideShieldComponent: true } });
            this.inDrillDownMode = true;
        }
    }

    goBackToOrchestrator() {
        this.inDrillDownMode = false;
        this._router.navigate([`../../../solutionorchestrator`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true, queryParams: { searchTerm: this.searchTerm } });
    }

    searchDetectors() {
        //Empty out the old sorted detectors array
        this.detectors = [];
        this._resourceService.getPesId().subscribe(pesId => {
            if (!((this.isPublic && detectorSearchEnabledPesIds.findIndex(x => x==pesId)<0) || (!this.isPublic && detectorSearchEnabledPesIdsInternal.findIndex(x => x==pesId)<0))){
                this.searchId = uuid();
                let searchTask = this._diagnosticService.getDetectorsSearch(this.searchTerm).pipe(map((res) => res), catchError(e => of([])));
                let detectorsTask = this._diagnosticService.getDetectors().pipe(map((res) => res), catchError(e => of([])));
                this.fetchingDetectors = true;
                //this.showPreLoader = true;
                observableForkJoin([searchTask, detectorsTask]).subscribe(results => {
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
                    }
                    this.detectorList = detectorList;
                    this.fetchingDetectors = false;
                    this.startDetectorRendering(null, false);
                }, (err) => {
                    this.fetchingDetectors = false;
                });
            }
        });
    }

    //checkKeystoneSolutions() {}

    startDetectorRendering(downTime: DownTime, containsDownTime: boolean) {
        this.issueDetectedViewModels = [];
        const requests: Observable<any>[] = [];

        this.detectorMetaData = this.detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
        this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, downTime, containsDownTime));
        this.detectorViewModels.forEach((metaData, index) => {
            requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
                map((response: DetectorResponse) => {
                    this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);

                    if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
                        if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description, solutions: insight.solutions, score: this.detectorViewModels[index].score };

                            if (this.issueDetectedViewModels.length > 0) {
                                this.issueDetectedViewModels = this.issueDetectedViewModels.filter(iVM => (!!iVM.model && !!iVM.model.metadata && !!iVM.model.metadata.id && iVM.model.metadata.id != issueDetectedViewModel.model.metadata.id));
                            }

                            this.issueDetectedViewModels.push(issueDetectedViewModel);
                            this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => n1.model.status - n2.model.status);
                        } else {
                            let insight = this.getDetectorInsight(this.detectorViewModels[index]);
                            let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description, score: this.detectorViewModels[index].score };

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
                    this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
                    return of({});
                })
            ));
        });

        // Log all the children detectors
        setTimeout(() => {
            if (this.getPendingDetectorCount()>0) {
                this.showSolutionsTimedout = true;
            }
        }, this.timeoutToShowSolutions);
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
            this.topLevelSolutions = this.allSolutions.filter(x => x.Score>this.detectorThresholdScore).sort((a, b) => {if (a.Score>b.Score) return -1; else return 1;});
            this.logEvent(TelemetryEventNames.SolutionOrchestratorSummary, {searchId: this.searchId, searchTerm: this.searchTerm, proposedSolutions: this.topLevelSolutions.map(x => {
                return {
                    title: x.Title,
                    detectorId: x.DetectorId,
                    score: x.Score
                };
            }), ts: Math.floor((new Date()).getTime() / 1000).toString()});
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

    updateDetectorViewModelSuccess(viewModel: any, res: DetectorResponse) {
        const status = res.status.statusId;

        viewModel.loadingStatus = LoadingStatus.Success,
            viewModel.status = status;
        viewModel.statusColor = StatusStyles.getColorByStatus(status),
            viewModel.statusIcon = StatusStyles.getIconByStatus(status),
            viewModel.response = res;
        return viewModel;
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

    getDetectorInsight(viewModel: any): any {
        let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(viewModel.response,true);
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
            insight = { title: detectorInsight.title, description: description, solutions: detectorInsight.solutions };

            // now populate solutions for all the insights
            allInsights.forEach(i => {
                if (i.solutions != null) {
                    i.solutions.forEach(s => {
                        if (this.allSolutions.findIndex(x => x.Name === s.Name) === -1) {
                            s.Score = viewModel.score;
                            this.allSolutions.push(s);
                        }
                    });
                }
            });
        }
        return insight;
    }

    getDetectorViewModel(detector: DetectorMetaData, downtime: DownTime, containsDownTime: boolean) {
        let startTimeString = this._detectorControl.startTimeString;
        let endTimeString = this._detectorControl.endTimeString;
        var detectorScore = this.detectors.find(x => x.id==detector.id).score;

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
            score: detectorScore,
            request: this._diagnosticService.getDetector(detector.id, startTimeString, endTimeString)
        };
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
}

