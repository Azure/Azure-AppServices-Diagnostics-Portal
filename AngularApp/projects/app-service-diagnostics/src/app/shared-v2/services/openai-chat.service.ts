import {map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {TextCompletionModel, OpenAIAPIResponse} from "diagnostic-data";
import { HttpHeaders } from '@angular/common/http';
import { ResourceService } from './resource.service';

@Injectable()
export class OpenAIChatService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  public isEnabled: boolean = false;

  public CheckEnabled(): Observable<boolean> {
    return this._backendApi.get<boolean>(`api/openai/enabled`).pipe(map((value: boolean) => { this.isEnabled = value; return value;}), catchError((err) => of(false)));
  }
  
  constructor(private _backendApi: BackendCtrlService, private _resourceService: ResourceService) { 
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    var productName = this._resourceService.searchSuffix;
    queryModel.prompt = `Please answer questions about ${productName}\n${queryModel.prompt}:`;
    return this._backendApi.post(this.completionApiPath, {payload: queryModel}, new HttpHeaders({"x-ms-openai-cache": caching.toString()})).pipe(map((response: OpenAIAPIResponse) => {
      return response;
    }));
  }
}