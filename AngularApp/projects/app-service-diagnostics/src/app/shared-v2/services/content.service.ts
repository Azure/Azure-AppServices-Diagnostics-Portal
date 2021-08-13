import {map,  mergeMap, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, ReplaySubject  } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResourceService } from './resource.service';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {DocumentSearchConfiguration, globalExcludedSites, Query} from "diagnostic-data";

@Injectable()
export class ContentService {

  content: any[] = [];

  private ocpApimKeySubject: Subject<string> = new ReplaySubject<string>(1);
  private ocpApimKey: string = '';
  private allowedStacks: string[] = ["net", "net core", "asp", "php", "python", "node", "docker", "java", "tomcat", "kube", "ruby", "dotnet", "static"];
  private authKey: string = "";
  private deepSearchEndpoint : string = "";
  private _config : DocumentSearchConfiguration;
  private featureEnabledForSupportTopic: boolean = false;
  httpOptions = {}

  
  constructor(private _http: HttpClient, private _resourceService: ResourceService, private _backendApi: BackendCtrlService) { 

    this._backendApi.get<string>(`api/appsettings/ContentSearch:Ocp-Apim-Subscription-Key`).subscribe((value: string) =>{
      this.ocpApimKey = value;
      this.ocpApimKeySubject.next(value);
    });

    this._config = new DocumentSearchConfiguration();
    this.fetchAppSettingsNeededForDeepSearch();

  }

  getContent(searchString?: string): Observable<any[]> {
    const searchResults = searchString ? this.content.filter(article => {
      return article.title.indexOf(searchString) != -1
        || article.description.indexOf(searchString) != -1;
    }) : this.content;

    return of(searchResults);
  }

  searchWeb(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = [], excludedSites: string[] = globalExcludedSites): Observable<any> {

    const query = this.constructQueryParameters(questionString, useStack,preferredSites, excludedSites);
    const url = `https://api.cognitive.microsoft.com/bing/v7.0/search?q='${query}'&count=${resultsCount}`;

    return this.ocpApimKeySubject.pipe(mergeMap((key:string)=>{
      return this._http.get(url, {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": this.ocpApimKey
          }
        })
      })
    );
  }

  public constructQueryParameters(questionString: string, useStack: boolean, preferredSites: string[], excludedSites: string[],) : string {
    const searchSuffix = this._resourceService.searchSuffix;
    //Decide the stack type to use with query
    var stackTypeSuffix = this._resourceService["appStack"] ? ` ${this._resourceService["appStack"]}` : "";
    stackTypeSuffix = stackTypeSuffix.toLowerCase();
    if (stackTypeSuffix && stackTypeSuffix.length > 0 && stackTypeSuffix == "static only") {
      stackTypeSuffix = "static content";
    }
    if (!this.allowedStacks.some(stack => stackTypeSuffix.includes(stack))) {
      stackTypeSuffix = "";
    }

    var preferredSitesSuffix = preferredSites.map(site => `site:${site}`).join(" OR ");
    if (preferredSitesSuffix && preferredSitesSuffix.length > 0) {
      preferredSitesSuffix = ` AND (${preferredSitesSuffix})`;
    }

    var excludedSitesSuffix = excludedSites.map(site => `NOT (site:${site})`).join(" AND ");
    if (excludedSitesSuffix && excludedSitesSuffix.length > 0) {
      excludedSitesSuffix = ` AND (${excludedSitesSuffix})`;
    }

    const query = encodeURIComponent(`${questionString}${useStack ? stackTypeSuffix : ''} AND ${searchSuffix}${preferredSitesSuffix}${excludedSitesSuffix}`);
    return query;
  }

  
  private fetchAppSettingsNeededForDeepSearch() {
    this._backendApi.get<string>(`api/appsettings/DeepSearch:Endpoint`).subscribe((value: string) => {
      this.deepSearchEndpoint = value;
    });

    this._backendApi.get<string>(`api/appsettings/DeepSearch:AuthKey`).subscribe((value: string) => {
      this.authKey = value;
      this.httpOptions = {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
          "authKey": this.authKey
        })
      };
    });
  }

  public IsDeepSearchEnabled(pesId : string, supportTopicId : string) : Observable<boolean> {
    // featureEnabledForProduct is disabled by default
    var isPesIdValid = pesId && pesId.length >0 ;
    var isSupportTopicIdValid = supportTopicId && supportTopicId.length > 0;
    if( isPesIdValid && isSupportTopicIdValid)
    {
      pesId = pesId.trim();
      supportTopicId = supportTopicId.trim();

      var listOfEnabledSupportTopics =  this._config.documentSearchEnabledSupportTopicIds[pesId];
    
      var isDeepSearchEnabledForThisSupportTopic = listOfEnabledSupportTopics && (listOfEnabledSupportTopics.length==0 || listOfEnabledSupportTopics.findIndex( x => x == supportTopicId ) > -1)
      this.featureEnabledForSupportTopic = isDeepSearchEnabledForThisSupportTopic ;
    }
   
    return this._backendApi.get<string>(`api/appsettings/DeepSearch:isEnabled`)
                            // Value in App Service Application Settings are returned as strings
                            // converting this to boolean
                            .map(status =>  ( status.toLowerCase() == "true" && this.featureEnabledForSupportTopic) );


  }

  public fetchResultsFromDeepSearch(query : Query): Observable<any>
  {
    if(query.bingSearchEnabled){
      query.customFilterConditionsForBing = this.constructQueryParameters(query.searchTerm, query.useStack, query.preferredSitesFromBing, query.excludedSitesFromBing);
      // Removing preferredSitesFromBing, excludedSitesFromBing, useStack as it is merged into customFilterConditionsForBing.
      query.preferredSitesFromBing = null;
      query.excludedSitesFromBing = null;
      query.useStack = null;
    }
    let queryString = this.constructUrl(query);
    return this._http.get<any>(this.deepSearchEndpoint+ "?" +queryString   , this.httpOptions)
  }

  private constructUrl(query: Query) : string{
    let  queryString = Object.keys(query).map(key => {
      if(query[key]){
        if(typeof (query[key] ) === "object" ){
          return query[key].map( value => {
            if (value != "")
              return key + "=" + value
            }).join("&");
        }
        else
          return key + '=' + query[key]
      }      
    }).filter(queryParam => queryParam!=null ).join("&");
    return queryString;
  }

}

export interface SearchResults {
  queryContext: { originalQuery: string };
}


