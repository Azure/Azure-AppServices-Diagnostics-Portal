import {map,  mergeMap, tap, catchError, flatMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, ReplaySubject  } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResourceService } from './resource.service';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {DocumentSearchConfiguration, globalExcludedSites, Query, DiagnosticService, DetectorControlService, DetectorResponse} from "diagnostic-data";

@Injectable()
export class ContentService {

  content: any[] = [];

  private allowedStacks: string[] = ["net", "net core", "asp", "php", "python", "node", "docker", "java", "tomcat", "kube", "ruby", "dotnet", "static"];
  private deepSearchEndpoint : string = "";
  private _config : DocumentSearchConfiguration;
  private featureEnabledForSupportTopic: boolean = false;
  httpOptions = {}
  private bingDetectorEnabledPesIds = ["14748", "16072", "16170", "15791", "15551"]

  
  constructor(private _http: HttpClient, private _resourceService: ResourceService, private _backendApi: BackendCtrlService, private _diagnosticService: DiagnosticService, private _detectorControlService: DetectorControlService) { 

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

  processDetectorResponse(response: DetectorResponse) {
    var status = response.dataset[0]?.table?.rows[0][0];
    var results = response.dataset[0]?.table?.rows[0][1];
    if (status && status == "200") {
      return JSON.parse(results);
    }
    else {
      return null;
    }
  }

  searchWebDetector(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = [], excludedSites: string[] = globalExcludedSites): Observable<any> {
    const query = this.constructQueryParametersDetectors(questionString, useStack,preferredSites, excludedSites);
    let queryString = `q=${query}&count=${resultsCount}`;
    let queryParams = `&text=${encodeURIComponent(queryString)}`;
    return this._diagnosticService.getDetector("BingDetectorId-1ce0e6a6-210d-43c8-9d90-0ab0dd171828", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, true, false, queryParams, null).pipe(
      map((response: DetectorResponse) => {
        return this.processDetectorResponse(response);
      }),
      catchError((err) => {throw err;})
    );
  }

  searchWeb(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = [], excludedSites: string[] = globalExcludedSites): Observable<any> {
    return this._resourceService.getPesId().pipe(flatMap(pesId => {
      if (this.bingDetectorEnabledPesIds.includes(pesId)) {
        return this.searchWebDetector(questionString, resultsCount, useStack, preferredSites, excludedSites).pipe(
          map((response: any) => response),
          catchError((err) => {
            if (err.status && err.status == 404) {
              const query = this.constructQueryParameters(questionString, useStack,preferredSites, excludedSites);
              return this._backendApi.get<string>(`api/bing/search?q=${query}&count=${resultsCount}`);
            }
            throw err;
          })
        );
      }
      else {
        const query = this.constructQueryParameters(questionString, useStack,preferredSites, excludedSites);
        return this._backendApi.get<string>(`api/bing/search?q=${query}&count=${resultsCount}`);
      }
    }));
  }

  public constructQueryParametersDetectors(questionString: string, useStack: boolean, preferredSites: string[], excludedSites: string[],) : string {
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
      preferredSitesSuffix = `(${preferredSitesSuffix})`;
    }

    var excludedSitesSuffix = excludedSites.map(site => `NOT (site:${site})`).join(" AND ");
    if (excludedSitesSuffix && excludedSitesSuffix.length > 0) {
      excludedSitesSuffix = `(${excludedSitesSuffix})`;
    }
    questionString = questionString.replace(/\\"/g, '');
    questionString = questionString.replace(/"/g, '');

    const query = JSON.stringify({
      queryText: encodeURIComponent(`${questionString}${useStack ? stackTypeSuffix : ''}`),
      productName: encodeURIComponent(searchSuffix),
      siteFilters: encodeURIComponent(`${preferredSitesSuffix} AND ${excludedSitesSuffix}`)
    });
    return query;
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
    this.deepSearchEndpoint = "";
  }

  public IsDeepSearchEnabled(pesId : string, supportTopicId : string) : Observable<boolean> {
    return Observable.of(false);
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


