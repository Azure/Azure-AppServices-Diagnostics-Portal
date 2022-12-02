import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PortalActionGenericService {
  constructor() {}

  public openChangeAnalysisBlade(
    startTime?: string,
    endTime?: string,
    resourceUri?: string
  ) {}

  public openFeedbackPanel() {}
}
