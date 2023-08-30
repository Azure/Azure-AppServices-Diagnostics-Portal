import { Injectable } from '@angular/core';
import { DetectorResponse, DetectorViewModeWithInsightInfo, DiagnosticData } from '../models/detector';
import { Observable } from 'rxjs';

@Injectable()
export class GenericDetectorCopilotService {

  isEnabled(): Observable<boolean> {
    return Observable.of(false);
  }

  initializeMembers(isAnalysisMode: boolean) {
  }

  processDetectorData(detectorData: DetectorResponse) {
  }

  processAsyncDetectorViewModels(detectorViewModels: DetectorViewModeWithInsightInfo[]) {
  }

  processAsyncFormsResponse(formId: any, formsResponse: DetectorResponse) {
  }

  selectComponentAndOpenCopilot(componentData: DiagnosticData) {
  }

  selectChildDetectorAndOpenCopilot(detectorViewModel: DetectorViewModeWithInsightInfo) {
  }

  reset() {
  }
}
