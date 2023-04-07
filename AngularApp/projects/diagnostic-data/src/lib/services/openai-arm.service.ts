import {map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of  } from 'rxjs';
import { DiagnosticService, DetectorControlService, DetectorResponse, GenericResourceService} from "../../public_api";

@Injectable()
export class OpenAIArmService {

  content: any[] = [];

  private allowedStacks: string[] = ["net", "net core", "asp", "php", "python", "node", "docker", "java", "tomcat", "kube", "ruby", "dotnet", "static"];
  public isEnabled: boolean = true;

  public CheckEnabled(): Observable<boolean> {
    return of(this.isEnabled);
  }
  
  constructor(private _resourceService: GenericResourceService, private _diagnosticService: DiagnosticService, private _detectorControlService: DetectorControlService) { 
  }

  processDetectorResponse(response: DetectorResponse) {
    var status = response.dataset[0]?.table?.rows[0][0];
    var results = response.dataset[0]?.table?.rows[0][1];
    if (status && status == "200") {
      return results;
    }
    else {
      return null;
    }
  }

  runOpenAIDetector(questionString: string, useStack: boolean = true): Observable<any> {
    const query = this.constructQueryBody(questionString, useStack);
    let queryParams = `&text=${encodeURIComponent(query)}`;
    return this._diagnosticService.getDetector("OpenAIDetectorId-1ce0e6a6-210d-43c8-9d90-0ab0dd171828", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, true, false, queryParams, null).pipe(
      map((response: DetectorResponse) => {
        return this.processDetectorResponse(response);
      }),
      catchError((err) => {throw err;})
    );
  }

  constructQueryBody(questionString: string, useStack: boolean) : any {
    let resourceType = this._resourceService.searchSuffix;
    //Decide the stack type to use with query
    var stackTypeSuffix = this._resourceService["appStack"] ? ` ${this._resourceService["appStack"]}` : "";
    stackTypeSuffix = stackTypeSuffix.toLowerCase();
    if (stackTypeSuffix && stackTypeSuffix.length > 0 && stackTypeSuffix == "static only") {
      stackTypeSuffix = "static content";
    }
    if (!this.allowedStacks.some(stack => stackTypeSuffix.includes(stack))) {
      stackTypeSuffix = "";
    }
    questionString = questionString.replace(/\\"/g, '');
    questionString = questionString.replace(/"/g, '');

    const query = JSON.stringify({
      query: encodeURIComponent(questionString),
      resourceType: resourceType,
      stackInfo: stackTypeSuffix
    });
    return query;
  }

  public getAnswer(questionString: string, caching: boolean = true): Observable<any> {
    return this.runOpenAIDetector(questionString, true);
  }
}