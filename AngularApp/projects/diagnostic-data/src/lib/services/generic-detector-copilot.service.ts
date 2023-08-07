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

  selectComponentAndOpenCopilot(componentData: DiagnosticData) {
  }

  processAsyncDetectorViewModels(detectorViewModels: DetectorViewModeWithInsightInfo[]) {
  }

  selectChildDetectorAndOpenCopilot(detectorViewModel: DetectorViewModeWithInsightInfo) {
  }

  reset() {
  }
}
