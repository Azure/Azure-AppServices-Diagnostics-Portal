import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http"
import { Observable } from 'rxjs';
import { Query, Document, DocumentSearchConfiguration } from 'diagnostic-data';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';

@Injectable({
  providedIn:"root"
})
export class ApplensDocumentsSearchService {
  private url : string = "";
  private _config : DocumentSearchConfiguration;
  private featureEnabledForProduct : boolean = false; 

  httpOptions = {}

  constructor(  private http: HttpClient,
                private _backendApi : DiagnosticApiService                 
              ) { 
    
    this._config = new DocumentSearchConfiguration();    
  }

  public IsEnabled(pesId : string) : Observable<boolean> {
    // featureEnabledForProduct is disabled by default
    return Observable.of(false);    
  }

  private constructUrl(query: Query) : string{
    let  queryString = Object.keys(query).map(key => {
      if(typeof (query[key] ) === "object" ){
        return query[key].map( value => {
          if (value != "")
            return key + "=" + value
          }).join("&");
      }
      else
        return key + '=' + query[key]
    }).join("&");
    
    return queryString;
  }

  public Search(query): Observable<Document[]> {   
    let queryString = this.constructUrl(query);
    let url = this.url  + "?" +queryString;
    return this.http.get<Document[]>(url, this.httpOptions)
                  
  }

}
