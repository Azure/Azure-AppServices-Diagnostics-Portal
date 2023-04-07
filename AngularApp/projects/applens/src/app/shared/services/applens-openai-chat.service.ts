import {catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { TextCompletionModel, OpenAIAPIResponse } from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';
import { HttpHeaders } from "@angular/common/http";
import { ResourceService } from './resource.service';

@Injectable()
export class ApplensOpenAIChatService {

  content: any[] = [];

  private completionApiPath: string = "api/openai/runTextCompletion";
  public isEnabled: boolean = false;
  private resourceProvider: string;
  private productName: string;

  public CheckEnabled(): Observable<boolean> {
    return this._backendApi.get<boolean>(`api/openai/enabled`).pipe(map((value: boolean) => { this.isEnabled = value; return value;}), catchError((err) => of(false)));
  }
  
  constructor(private _backendApi: DiagnosticApiService, private _resourceService: ResourceService) {
    this.resourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    this.productName = this._resourceService.searchSuffix + ((this.resourceProvider === 'microsoft.web/sites')? ` ${this._resourceService.displayName}`: '');
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    queryModel.prompt = `You are helping support eningeers to debug issues related to ${this.productName}. Do not be repetitive when providing steps in your answer. Please answer the below question\n${queryModel.prompt}:`;
    return this._backendApi.post(this.completionApiPath, {payload: queryModel}, new HttpHeaders({"x-ms-openai-cache": caching.toString()})).pipe(map((response: OpenAIAPIResponse) => {
      return response;
    }));
  }
}