import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CompilationProperties } from '../models/compilation-properties';
import { QueryResponse } from '../models/compiler-response';
import { workflowPublishBody, workflowNodeResult } from '../models/workflow';


@Injectable({
  providedIn: 'root'
})
export class WorkflowHelperService {

  constructor() { }

  // Observable string sources
  private emitChangeSource = new Subject<workflowNodeResult>();

  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();

  // Service message commands
  emitTraces(change: workflowNodeResult) {
    this.emitChangeSource.next(change);
  }

  getWorkflowNodeResultFromCompilationResponse(response: any, workflowPublishBody: workflowPublishBody): workflowNodeResult {
    let workflowQueryResponse: QueryResponse<workflowNodeResult> = response.body;
    let workflowNodeResult: workflowNodeResult = null;
    if (workflowQueryResponse.runtimeSucceeded && workflowQueryResponse.invocationOutput != null) {
      workflowNodeResult = workflowQueryResponse.invocationOutput;
      workflowNodeResult.workflowPublishBody = workflowPublishBody;

      if (response.headers.get('diag-script-etag') != undefined) {
        workflowNodeResult.compilationProperties = new CompilationProperties();
        workflowNodeResult.compilationProperties.scriptETag = response.headers.get('diag-script-etag');
        workflowNodeResult.compilationProperties.assemblyName = workflowQueryResponse.compilationOutput.assemblyName;
        workflowNodeResult.compilationProperties.assemblyBytes = workflowQueryResponse.compilationOutput.assemblyBytes;
        workflowNodeResult.compilationProperties.pdbBytes = workflowQueryResponse.compilationOutput.pdbBytes;
      }
    }

    workflowNodeResult.isOnboardingMode = true;
    return workflowNodeResult;
  }
}
