import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { GenericContentService } from '../../services/generic-content.service';
import { of, Observable, forkJoin } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { WebSearchConfiguration } from '../../models/search';
import { GenericResourceService } from '../../services/generic-resource-service';
import { AvailableDocumentTypes, Query } from '../../models/documents-search-models';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import { DocumentSearchConfiguration } from '../../models/documents-search-config';
import { GenericDocumentsSearchService } from '../../services/generic-documents-search.service';

@Component({
    selector: 'web-search',
    templateUrl: './web-search.component.html',
    styleUrls: ['./web-search.component.scss']
})

export class WebSearchComponent extends DataRenderBaseComponent implements OnInit {
    isPublic: boolean = false;
    viewRemainingArticles : boolean = false;
    deepSearchEnabled : boolean = false;
    @Input() searchTerm: string = '';
    @Input() searchId: string = '';
    @Input() isChildComponent: boolean = true;
    @Input('webSearchConfig') webSearchConfig: WebSearchConfiguration;
    @Input() searchResults: any[] = [];
    @Input() numArticlesExpanded : number = 5;
    @Output() searchResultsChange: EventEmitter<any[]> = new EventEmitter<any[]>();
    pesId : string = "";
    sapProductId: string = "";

    supportTopicId : string = "";
    sapSupportTopicId:string = "";

    customQueryParametersForBingSearch : string = "";

    searchTermDisplay: string = '';
    showSearchTermPractices: boolean = false;
    showPreLoader: boolean = false;
    showPreLoadingError: boolean = false;
    preLoadingErrorMessage: string = "An error occurred while fetching web results from the web. We will be fixing this soon. Please try again later."
    subscription: ISubscription;
    deepSearchConfig: DocumentSearchConfiguration;
    
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _activatedRoute: ActivatedRoute, private _router: Router, private _contentService: GenericContentService,
        private _supportTopicService: GenericSupportTopicService,
        private _resourceService: GenericResourceService,
        private _documentsSearchService : GenericDocumentsSearchService ) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
        this.supportTopicId = this._supportTopicService.supportTopicId;
        this.sapSupportTopicId = this._supportTopicService.sapSupportTopicId;
        this.deepSearchConfig = new DocumentSearchConfiguration();;
        const subscription = this._activatedRoute.queryParamMap.subscribe(qParams => {
            this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
            this.getPesId();
            this.getSapProductId();
            this.checkIfDeepSearchIsEnabled();
            this.refresh();
        });
        this.subscription = subscription;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
    
    ngOnInit() {
        if(!this.isChildComponent)
        {
            this.refresh();
        }
    }

    refresh() {
        if (this.searchTerm && this.searchTerm.length > 1) {
            setTimeout(()=> {this.triggerSearch();}, 500);
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

            if(!this.deepSearchEnabled){ // Rank only results from Bing
                this.searchResults = this.rankResultsBySource(this.searchResults);
            }
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
        var searchTask;
        let searchTaskComplete = false;
        let searchTaskPrefsComplete = false;
        let searchTaskPrefs = null;
        let searchTaskResult = null;
        let searchTaskPrefsResult = null;
        
        var shouldGetResultsFromDeepSearch = this.isPublic &&  this.deepSearchEnabled;
        if(! shouldGetResultsFromDeepSearch){
            // make call to bing search
            var preferredSites = [];
            searchTask = this.getBingSearchTask(preferredSites);
            if (this.webSearchConfig && this.webSearchConfig.PreferredSites && this.webSearchConfig.PreferredSites.length>0) {
                searchTaskPrefs = this.getBingSearchTask(this.webSearchConfig.PreferredSites);
            }
            else {
                searchTaskPrefsComplete = true;
            }
        }
        else{
            // make a call to deep search which combine bing + deep search engine results
            var query = this.getInputsForDeepSearch();
            searchTask = this.getDeepSearchTask(query);            
            searchTaskPrefsComplete = true;
        }
        
        this.showPreLoader = true;
        let postFinish = () => {
            if (searchTaskComplete && searchTaskPrefsComplete) {
                let results = this.mergeResults([searchTaskResult, searchTaskPrefsResult]);
                this.displayResults(results);
            }
        }
        searchTask.subscribe(res => {
            searchTaskResult = res;
            searchTaskComplete = true;
            postFinish();
        }, (err)=> {
            this.showPreLoadingError = true;
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
                this.showPreLoadingError = true;
                searchTaskPrefsResult = null;
                searchTaskPrefsComplete = true;
                postFinish();
            });
        }
    }

    private getInputsForDeepSearch() {
        var query = new Query();
        query.searchTerm = this.searchTerm;
        query.searchId = this.searchId;
        query.numberOfDocuments = this.webSearchConfig.MaxResults;
        query.documentType = AvailableDocumentTypes.External;
        query.bingSearchEnabled = true;
        query.deepSearchEnabled = this.deepSearchEnabled;
        query.pesId = this.pesId;
        query.supportTopicId = this.supportTopicId;
        query.preferredSitesFromBing = [];
        query.excludedSitesFromBing = [];
        if(this.webSearchConfig){
            if(this.webSearchConfig.PreferredSites && this.webSearchConfig.PreferredSites.length > 0){
                query.preferredSitesFromBing = this.webSearchConfig.PreferredSites    
            }
            if(this.webSearchConfig.ExcludedSites && this.webSearchConfig.ExcludedSites.length > 0){
                query.excludedSitesFromBing = this.webSearchConfig.ExcludedSites    
            }

            query.useStack = this.webSearchConfig.UseStack;
        }
        return query;
    }

    private getDeepSearchTask(query: Query) {
        return this._contentService.fetchResultsFromDeepSearch(query).pipe(map((res) => res), retryWhen(errors => {
            let numRetries = 0;
            return errors.pipe(delay(1000), map(err => {
                if (numRetries++ === 3) {
                    this.handleDeepSearchFailure();
                    throw err;
                }
                return err;
            }));
        }), catchError(e => {
            throw e;
        }));
    }

    private handleDeepSearchFailure() {
        this.deepSearchEnabled = false;
        this.triggerSearch();
    }

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

    selectResult(article: any) {
      window.open(article.link, '_blank');
      this.logEvent(TelemetryEventNames.WebQueryResultClicked, { searchId: this.searchId, article: JSON.stringify(article), ts: Math.floor((new Date()).getTime() / 1000).toString() });
    }
  
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

    public getEffectiveProductId():string{
        if(this.sapProductId){
            return this.sapProductId;
        }
        else if(this.pesId){
            return this.pesId;
        }
        else{
            return '';
        }
    }

    public getEffectiveSupportTopicId():string{
        if(this.sapSupportTopicId){
            return this.sapSupportTopicId;
        }
        else if(this.supportTopicId){
            return this.supportTopicId;
        } else {
            return '';
        }
    }
    
    checkIfDeepSearchIsEnabled () {

        var deepSearchObservable = this.isPublic ? this._contentService.IsDeepSearchEnabled(this.getEffectiveProductId(), this.getEffectiveSupportTopicId()) :
                                                   this._documentsSearchService.IsEnabled(this.getEffectiveProductId()) 

        
        let checkStatusTask = deepSearchObservable.pipe( map((res) => res), 
                                                         retryWhen(errors => {
                                                         let numRetries = 0;
                                                         return errors.pipe(delay(1000), map(err => {
                                                             if(numRetries++ === 3){
                                                                 throw err;
                                                             }
                                                             return err;
                                                             }));
                                                         }), 
                                                         catchError(e => {
                                                             throw e;
                                                         })
                                                         );
        checkStatusTask.subscribe((status) => {
                this.deepSearchEnabled = status;                
            },
            (err) => {
                this.deepSearchEnabled = false;
            }
        );    
    }

}  
