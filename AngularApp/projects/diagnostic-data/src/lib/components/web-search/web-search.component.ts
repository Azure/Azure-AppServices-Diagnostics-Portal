import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { GenericContentService } from '../../services/generic-content.service';
import { of, Observable } from 'rxjs';
import { ISubscription } from "rxjs/Subscription";
import { WebSearchConfiguration } from '../../models/search';

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
    @Input('webSearchConfig') webSearchConfig: WebSearchConfiguration = new WebSearchConfiguration();
    @Input() searchResults: any[] = [];
    @Input() numArticlesExpanded : number = 2;
    @Output() searchResultsChange: EventEmitter<any[]> = new EventEmitter<any[]>();

    searchTermDisplay: string = '';
    showSearchTermPractices: boolean = false;
    showPreLoader: boolean = false;
    showPreLoadingError: boolean = false;
    preLoadingErrorMessage: string = "Some error occurred while fetching web results."
    subscription: ISubscription;
    
    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, public telemetryService: TelemetryService,
        private _activatedRoute: ActivatedRoute, private _router: Router, private _contentService: GenericContentService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
        const subscription = this._activatedRoute.queryParamMap.subscribe(qParams => {
            this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
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
        if (!this.isChildComponent || !this.searchId || this.searchId.length <1 ) 
            this.searchId = uuid();
        
    
        let searchTask = this._contentService.searchWeb(this.searchTerm, this.webSearchConfig.MaxResults.toString(), this.webSearchConfig.UseStack, this.webSearchConfig.PreferredSites).pipe(map((res) => res), retryWhen(errors => {
            let numRetries = 0;
            return errors.pipe(delay(1000), map(err => {
                if(numRetries++ === 3){
                    throw err;
                }
                return err;
            }));
        }), catchError(e => {
            this.handleRequestFailure();
            return Observable.throw(e);
        }));
        this.showPreLoader = true;
        searchTask.subscribe(results => {
            this.showPreLoader = false;
            if (results && results.webPages && results.webPages.value && results.webPages.value.length > 0) {
                this.searchResults = results.webPages.value.map(result => {
                    return {
                        title: result.name,
                        description: result.snippet,
                        link: result.url
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
                    link: result.link
                };
            })), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        },
        (err) => {
            this.handleRequestFailure();
        });
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
      }

}  
