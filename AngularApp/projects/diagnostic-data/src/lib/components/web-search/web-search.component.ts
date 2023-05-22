import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { GenericContentService } from '../../services/generic-content.service';
import { of, Observable, combineLatest } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { WebSearchConfiguration } from '../../models/search';
import { GenericResourceService } from '../../services/generic-resource-service';
import { AvailableDocumentTypes, Query } from '../../models/documents-search-models';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import { DocumentSearchConfiguration } from '../../models/documents-search-config';
import { GenericDocumentsSearchService } from '../../services/generic-documents-search.service';
import { SearchAnalysisMode } from '../../models/search-mode';

@Component({
    selector: 'web-search',
    templateUrl: './web-search.component.html',
    styleUrls: ['./web-search.component.scss']
})

export class WebSearchComponent extends DataRenderBaseComponent implements OnInit {
    isPublic: boolean = false;
    viewRemainingArticles : boolean = false;
    @Input() searchTerm: string = '';
    @Input() searchId: string = '';
    @Input() isChildComponent: boolean = true;
    @Input() searchMode: SearchAnalysisMode = SearchAnalysisMode.DetectorView;
    @Input('webSearchConfig') webSearchConfig: WebSearchConfiguration;
    @Input() searchResults: any[] = [];
    @Input() numArticlesExpanded : number = 5;
    @Output() searchResultsChange: EventEmitter<any[]> = new EventEmitter<any[]>();
    @Output() onComplete: EventEmitter<any> = new EventEmitter<any>();
    pesId : string = "";
    sapProductId: string = "";

    supportTopicId : string = "";
    sapSupportTopicId:string = "";

    customQueryParametersForBingSearch : string = "";

    searchTermDisplay: string = '';
    showSearchTermPractices: boolean = false;
    withinGenie: boolean = false;
    showPreLoader: boolean = false;
    showPreLoadingError: boolean = false;
    preLoadingErrorMessage: string = "An error occurred while fetching results from the web. We will be fixing this soon. Please try again later."
    subscription: ISubscription;
    
    headerStatement: string = '';
    
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _activatedRoute: ActivatedRoute, private _router: Router, private _contentService: GenericContentService,
        private _supportTopicService: GenericSupportTopicService,
        private _resourceService: GenericResourceService,
        private _documentsSearchService : GenericDocumentsSearchService ) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
        this.supportTopicId = this._supportTopicService.supportTopicId;
        this.sapSupportTopicId = this._supportTopicService.sapSupportTopicId;
        const subscription = this._activatedRoute.queryParamMap.subscribe(qParams => {
            this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
            this.getPesId();
            this.getSapProductId();
            this.refresh();
        });
        this.withinGenie = (this.searchMode == SearchAnalysisMode.Genie);
        this.headerStatement = this.withinGenie? "Recommended Documents": "Here are some documents from the web that might help you";
        this.subscription = subscription;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
    
    ngOnInit() {
        this.withinGenie = (this.searchMode == SearchAnalysisMode.Genie);
        if(!this.isChildComponent || this.withinGenie)
        {
            this.refresh();
        }
        else {
            this.onComplete.emit();
        }
    }

    refresh() {
        if (this.searchTerm && this.searchTerm.length > 1) {
            setTimeout(()=> {this.triggerSearch();}, 500);
        }
        else {
            this.onComplete.emit();
        }
    }

    clearSearchTerm() {
        this.searchTerm = "";
    }

    handleRequestFailure() {
        this.showPreLoadingError = true;
        this.showPreLoader = false;
        this.showSearchTermPractices = false;
    }

    mergeResults(results) {
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

    displayResults(results) {
        this.showPreLoader = false;
        if (results && results.webPages && results.webPages.value && results.webPages.value.length > 0) {
            
            var webSearchResults = results.webPages.value;
            this.searchResults = webSearchResults.map(result => {
                return {
                    title: result.name,
                    description: result.snippet,
                    link: result.url,
                    articleSurfacedBy : result.resultSurfacedBy || "Bing"
                };
            });
             this.searchResultsChange.emit(this.searchResults);
        }
        else {
            this.searchTermDisplay = this.searchTerm.valueOf();
            this.showSearchTermPractices = true;
        }
        this.logEvent(TelemetryEventNames.WebQueryResults, { searchId: this.searchId, query: this.searchTerm, results: JSON.stringify(this.searchResults.map(result => {
            return {
                title: result.title.replace(";"," "),
                description: result.description.replace(";", " "),
                link: result.link,
                articleSurfacedBy : result.articleSurfacedBy || "Bing"
            };
        })), ts: Math.floor((new Date()).getTime() / 1000).toString() });
    }

    triggerSearch() {
        if (!this.isChildComponent){
            const queryParams: Params = { searchTerm: this.searchTerm };
            this._router.navigate(
                [],
                {
                    relativeTo: this._activatedRoute,
                    queryParams: queryParams,
                    queryParamsHandling: 'merge'
                }
            );
        }
        this.resetGlobals();
        if (!this.isChildComponent || !this.searchId || this.searchId.length <1) this.searchId = uuid();
        if (!this.webSearchConfig) {
            this.webSearchConfig = new WebSearchConfiguration(this.pesId, null);
        }
        let searchTaskPrefs = null;

        // make call to bing search using preferred sites on the product level
        var preferredSites = [];
        var searchTask = this.getBingSearchTask(preferredSites);

        // if the parent component e.g. detector author has specified preferred sites, make a call to bing search using those preferred sites as well
        this.webSearchConfig = null;
        if (this.webSearchConfig && this.webSearchConfig.PreferredSites && this.webSearchConfig.PreferredSites.length>0) {
            searchTaskPrefs = this.getBingSearchTask(this.webSearchConfig.PreferredSites);
        }
        else {
            searchTaskPrefs = of(null); 
        }

        this.showPreLoader = true;
        combineLatest([searchTask, searchTaskPrefs]).subscribe(resultPair => {
            try {
                let results = this.mergeResults(resultPair);
                this.displayResults(results);
                setTimeout(()=> {this.onComplete.emit();}, 500);
            }
            catch (e) {
                this.showPreLoadingError = true;
                this.onComplete.emit();
            }
        },
        (err) => {
            this.showPreLoadingError = true;
            this.onComplete.emit();
        });
    }

    // Actual method that returns the task that makes the bing search call
    private getBingSearchTask(preferredSites:string[]) {
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

    // when the user clicks on a result
    selectResult(article: any) {
        window.open(article.link, '_blank');
        this.logEvent(TelemetryEventNames.WebQueryResultClicked, { searchId: this.searchId, article: JSON.stringify(article), ts: Math.floor((new Date()).getTime() / 1000).toString() });
    }

    // Helper methods  
    getLinkText(link: string) {
      return !link || link.length < 20 ? link : link.substr(0, 25) + '...';
    }

    resetGlobals() {
        this.searchResults = [];
        this.showPreLoader = false;
        this.showPreLoadingError = false;
        this.showSearchTermPractices = false;
        this.searchTermDisplay = "";
    }

    // when the user click on view more results/ hide results
    viewOrHideAnchorTagText(viewRemainingArticles: boolean , 
                            totalDocuments : number,
                            numDocumentsExpanded : number){
    
        let remainingDocuments: string = "";
        if (totalDocuments && numDocumentsExpanded){
        remainingDocuments = `${totalDocuments - numDocumentsExpanded}`;
        remainingDocuments = viewRemainingArticles ?  `last ${remainingDocuments} ` : remainingDocuments
        }
    
        return !viewRemainingArticles ? `View ${remainingDocuments} more documents` : 
                        `Hide ${remainingDocuments} documents`;    
    }
    

    // the method that takes care of showing "more results" after user clicks on "view more results"
    showRemainingArticles(){
        this.viewRemainingArticles =!this.viewRemainingArticles
        if(this.viewRemainingArticles){
            this.logEvent(TelemetryEventNames.MoreWebResultsClicked, { 
                searchId: this.searchId, 
                searchTerm: this.searchTerm, 
                ts: Math.floor((new Date()).getTime() / 1000).toString() 
                }
            );
        }
    }

    getPesId(){
        this._resourceService.getPesId().subscribe(pesId => {
            this.pesId = pesId;
        });    
    }

    getSapProductId(){
        this._resourceService.getSapProductId().subscribe(sapProductId => {
            this.sapProductId = sapProductId;
        });
    }
}  
