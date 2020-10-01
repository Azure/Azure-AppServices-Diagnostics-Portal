import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ISubscription } from "rxjs/Subscription";
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { map, catchError, delay, retryWhen, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { GenericDocumentsSearchService } from '../../services/generic-documents-search.service';
import { Query } from '../../models/documents-search-models';
import { GenericResourceService } from '../../services/generic-resource-service';


@Component({
  selector: 'documents-search',
  templateUrl: './documents-search.component.html',
  styleUrls: ['./documents-search.component.scss']
})
export class DocumentsSearchComponent extends DataRenderBaseComponent  implements OnInit {

  
  enabled : boolean = false;
  showSearchTermPractices: boolean = false;
  showPreLoader: boolean = false;
  showPreLoadingError: boolean = false;
  viewResultsFromCSSWikionly : boolean = true;
  viewRemainingDocuments : boolean = false;
  isPublic : boolean = true;
  pesId : string = "";
  searchTermDisplay = ""
  preLoadingErrorMessage: string = "Some error occurred while fetching Deep Search results. "
  subscription: ISubscription;
    
  @Input() searchTerm : string = ""; 
  @Input() isChildComponent: boolean = true;
  @Input() searchId : string = "";
  @Input() numDocumentsExpanded: number = 2;
 
  @Output() deepSearchResults : Document[];
  @Output() deepSearchResultsChange: EventEmitter<Document[]> = new EventEmitter<Document[]>();
 
  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, 
              private _documentsSearchService : GenericDocumentsSearchService,
              public telemetryService: TelemetryService,
              private _activatedRoute: ActivatedRoute ,
              private _router: Router,
              private _resourceService: GenericResourceService   ) {
    super(telemetryService);
 
    this.isPublic = config && config.isPublic;
    const subscription = this._activatedRoute.queryParamMap.subscribe(qParams => {
      this.searchTerm = qParams.get('searchTerm') === null ? "" || this.searchTerm : qParams.get('searchTerm');
      this.getPesId();
      this.checkIfEnabled();
  });

  this.subscription = subscription;
   }
  
  ngOnInit() {
    if(!this.isChildComponent)
        this.checkIfEnabled();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  getPesId(){
    this._resourceService.getPesId().subscribe(pesId => {
      this.pesId = pesId;
    });
    
  }

  checkIfEnabled () {
    let checkStatusTask = this._documentsSearchService
                         .IsEnabled(this.pesId, this.isPublic )
                         .pipe( map((res) => res), 
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
                                    this.handleRequestFailure();
                                    return Observable.throw(e);
                                })
                              );
    this.showPreLoader = true;
    checkStatusTask.subscribe(
      (status) => {   this.enabled = status;
                      this.refresh();
                      this.showPreLoader = false;
                  },
      (err) => {  this.logEvent(TelemetryEventNames.DeepSearchResults, { 
                  operationStatus: "failed",
                  error: JSON.stringify(err), 
                  ts: Math.floor((new Date()).getTime() / 1000).toString() 
                });

               });
    
  }

  refresh(){
    if (this.enabled && this.searchTerm && this.searchTerm.length > 1) {
      setTimeout(()=> {
          this.triggerSearch();
      }, 500);
    }
  }

  triggerSearch(){
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
    
    if (!this.isChildComponent || !this.searchId || this.searchId.length <1)
      this.searchId = uuid();
    
    
    let query: Query = {
      "searchId" : this.searchId,
      "searchTerm" : this.searchTerm,
      "productName" : "App Services" ,
      "documentType" : this.isPublic ? "External" : "Internal" ,
      "documentSource" : [],
      "numberOfDocuments" : 5  

    };

    if(! this.isPublic && this.viewResultsFromCSSWikionly){
      query.documentSource.push("supportability.visualstudio.com")
    }

    let searchTask = this._documentsSearchService
                         .Search(query)
                         .pipe(map((res) => res), retryWhen(errors => {
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
    searchTask.subscribe(
      (results) => {
        this.showPreLoader = false;
        if (results && results.documents && results.documents.length > 0) {
            this.deepSearchResults = results.documents
            this.deepSearchResultsChange.emit(this.deepSearchResults);
        }
        else {
          
            this.searchTermDisplay = this.searchTerm.valueOf();
            this.showSearchTermPractices = true;
            
        }

        this.logEvent(TelemetryEventNames.DeepSearchResults, { 
          operationStatus: "success",
          searchId: this.searchId, 
          query: JSON.stringify(query), 
          numberofDocuments : this.deepSearchResults.length,
          maxRelevancyScore : this.deepSearchResults.length> 0 ? this.deepSearchResults[0]["score"] : 0 ,
          ts: Math.floor((new Date()).getTime() / 1000).toString() 
        });

      },
      (err) => {
          this.logEvent(TelemetryEventNames.DeepSearchResults, { 
          operationStatus: "failed",
          searchId: this.searchId, 
          query: JSON.stringify(query), 
          error: JSON.stringify(err), 
          ts: Math.floor((new Date()).getTime() / 1000).toString() 
        });
          this.handleRequestFailure();
      });
  }

  resetGlobals() {
    this.deepSearchResults = null;
    this.showPreLoader = false;
    this.showPreLoadingError = false;
    this.showSearchTermPractices = false;
    this.searchTermDisplay = "";
    this.searchId = "";
  }

  handleRequestFailure() {
    this.showPreLoadingError = true;
    this.showPreLoader = false;
    this.showSearchTermPractices = false;
  }

  // Methods used in Components 
  viewOrHideAnchorTagText(viewRemainingDocuments: boolean , 
    totalDocuments : number,
    numDocumentsExpanded : number){

    let remainingDocuments: string = "";
    if (totalDocuments && numDocumentsExpanded){
    remainingDocuments = `${totalDocuments - numDocumentsExpanded}`;
    remainingDocuments = viewRemainingDocuments ?  `last ${remainingDocuments} ` : remainingDocuments
    }

    return !viewRemainingDocuments ? `View ${remainingDocuments} more documents` : 
                                     `Hide ${remainingDocuments} documents`;

    }
  
  toggleCSSWikiResults() {
    this.viewResultsFromCSSWikionly = !this.viewResultsFromCSSWikionly;
    this.refresh();
  }

  getLinkText(link: string) {
    return !link || link.length < 30 ? link : link.substr(0, 40) + '...';
   }

  showRemainingArticles(){
    this.viewRemainingDocuments =!this.viewRemainingDocuments
  }

  selectResult(document: any) {
    window.open(document.url , '_blank');
    this.logEvent(TelemetryEventNames.DeepSearchResultClicked, { 
      searchId: this.searchId, 
      article: JSON.stringify(document), 
      ts: Math.floor((new Date()).getTime() / 1000).toString() 
    });
  }

  limitTextCharacters (text : string,  numChars : number) 
  {
    return text.length<numChars? text :  text.substring(0, numChars) + "...";
  }


}
