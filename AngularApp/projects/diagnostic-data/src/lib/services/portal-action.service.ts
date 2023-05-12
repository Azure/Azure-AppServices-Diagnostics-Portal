import { Injectable } from '@angular/core';
import { OptInsightsResource, OptInsightsTimeContext } from '../models/optinsights';

@Injectable({
  providedIn: 'root'
})
export class PortalActionGenericService {

  constructor() { }

  public openChangeAnalysisBlade(startTime?: string, endTime?: string, resourceUri?: string) {

  }

  public openFeedbackPanel(){}

  public openOptInsightsBladewithTimeRange(appInsightsResourceUri: OptInsightsResource, optInsightsTimeContext: OptInsightsTimeContext) {
  }

  public openOptInsightsBlade(appInsightsResourceUri: OptInsightsResource) {}

}
