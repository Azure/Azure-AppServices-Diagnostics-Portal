import { Injectable } from '@angular/core';
import { DetectorResponse, DetectorViewModeWithInsightInfo } from '../models/detector';
import { DiagnosticData } from 'dist/diagnostic-data/public_api';

@Injectable()
export class GenericDetectorCopilotService {

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
