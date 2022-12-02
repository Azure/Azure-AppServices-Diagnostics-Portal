import { Injectable } from '@angular/core';
import { IDetectorAbnormalTimePeriod } from '../models/detectorresponse';

@Injectable()
export class DetectorViewStateService {
  private detectorViewStates = {};

  setDetectorViewState(
    detectorAbnormalTimePeriod: IDetectorAbnormalTimePeriod
  ): void {
    if (detectorAbnormalTimePeriod) {
      this.detectorViewStates[detectorAbnormalTimePeriod.source] =
        detectorAbnormalTimePeriod;
    }
  }

  getDetectorViewState(detectorName: string): IDetectorAbnormalTimePeriod {
    if (this.detectorViewStates[detectorName]) {
      const abnormalTimePeriod = this.detectorViewStates[detectorName];
      delete this.detectorViewStates[detectorName];
      return abnormalTimePeriod;
    }

    return null;
  }
}
