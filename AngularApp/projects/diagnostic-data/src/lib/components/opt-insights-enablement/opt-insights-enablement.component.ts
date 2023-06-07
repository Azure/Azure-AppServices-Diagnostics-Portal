import { Component, Input, OnInit } from '@angular/core';
import { CodeOptimizationType, CodeOptimizationsLogEvent, CodeOptimizationsRequest, OptInsightsResource, OptInsightsTimeContext } from '../../models/optinsights';
import { OptInsightsGenericService } from '../../services/optinsights.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { DetectorControlService } from '../../services/detector-control.service';
import { PortalActionGenericService } from '../../services/portal-action.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { ActivatedRoute } from '@angular/router';
import * as moment from 'moment';

@Component({
  selector: 'opt-insights-enablement',
  templateUrl: './opt-insights-enablement.component.html',
  styleUrls: ['./opt-insights-enablement.component.scss']
})
export class OptInsightsEnablementComponent implements OnInit {
  error: any;

  constructor(private _optInsightsService: OptInsightsGenericService, private portalActionService: PortalActionGenericService, private _detectorControlService: DetectorControlService, private _route: ActivatedRoute) { }

  subscriptionId: string;
  table: any = [];
  descriptionColumnName: string = "";
  allowColumnSearch: boolean = false;
  tableHeight: string = "";
  tableDescription: string = "";
  searchPlaceholder: string = "";
  loading: boolean;
  aRMToken: string = "";
  aRMTokenSubject = new BehaviorSubject<string>("");
  appInsightsResourceUri: string = "";
  type: CodeOptimizationType = CodeOptimizationType.All;
  isBetaSubscription: boolean = false;
  codeOptimizationsRequest: CodeOptimizationsRequest;


  @Input() optInsightResourceInfo: Observable<{ resourceUri: string, appId: string, type?: CodeOptimizationType }>;
  @Input() detectorId: string = "";

  ngOnInit(): void {
    this.loading = true;
    this.optInsightResourceInfo.subscribe(optInsightResourceInfo => {
      if (optInsightResourceInfo.type !== null) {
        this.type = optInsightResourceInfo.type;
      }
      if (optInsightResourceInfo.resourceUri !== null && optInsightResourceInfo.appId !== null) {
        this.appInsightsResourceUri = optInsightResourceInfo.resourceUri;
        this.codeOptimizationsRequest = { 
          appInsightsResourceId: optInsightResourceInfo.resourceUri,
          appId: optInsightResourceInfo.appId,
          site: this._route.parent.snapshot.parent.params['resourcename'],
          startTime: this._detectorControlService.startTime,
          endTime: this._detectorControlService.endTime,
          invalidateCache: false,
          //type: CodeOptimizationType.Blocking
          type: this.detectorId === 'webappcpu' ? CodeOptimizationType.CPU : this.detectorId === 'Memoryusage' ? CodeOptimizationType.Memory : this.detectorId === 'perfAnalysis' ? CodeOptimizationType.Blocking : CodeOptimizationType.All
        }
        this._optInsightsService.getInfoForOptInsights(this.codeOptimizationsRequest).subscribe(res => {
          if (res) {
            this.table = res;
            let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
              resourceUri: optInsightResourceInfo.resourceUri,
              telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsReceived
            };
            this._optInsightsService.logOptInsightsEvent(codeOptimizationsLogEvent);
          }
          this.loading = false;
        }, error => {
          this.loading = false;
          this.error = error;
        });
      }
      else {
        this.loading = false;
      }
    });
  }

  public openOptInsightsBlade() {
    let optInsightsResource: OptInsightsResource = this.parseOptInsightsResource(this.appInsightsResourceUri, 0, 'microsoft.insights/components', false);
    this.portalActionService.openOptInsightsBlade(optInsightsResource);
  }

  public openOptInsightsBladewithTimeRange() {
    //const currentMoment = moment.utc();
    var durationMs = this._detectorControlService.endTime.diff(this._detectorControlService.startTime, 'milliseconds');
    let optInsightsResource: OptInsightsResource = this.parseOptInsightsResource(this.appInsightsResourceUri, 0, 'microsoft.insights/components', false);
    let optInsightsTimeContext: OptInsightsTimeContext = { durationMs: durationMs, endTime: this._detectorControlService.endTime.toISOString(), createdTime: this._detectorControlService.startTime.toISOString(), isInitialTime: false, grain: 1, useDashboardTimeRange: false};
    this.portalActionService.openOptInsightsBladewithTimeRange(optInsightsResource, optInsightsTimeContext, this._route.parent.snapshot.parent.params['resourcename']);
  }


  parseOptInsightsResource(resourceUri: string, linkedApplicationType: number, resourceType: string, isAzureFirst: boolean): OptInsightsResource {
    var output: OptInsightsResource = {
      SubscriptionId: '',
      ResourceGroup: '',
      Name: '',
      LinkedApplicationType: linkedApplicationType,
      ResourceId: resourceUri,
      ResourceType: resourceType,
      IsAzureFirst: isAzureFirst
    };

    if (!resourceUri) {
      return output;
    }

    const resourceUriParts = resourceUri.toLowerCase().split('/');

    const subscriptionIndex = resourceUriParts.indexOf('subscriptions');
    if (subscriptionIndex > -1) {
      output.SubscriptionId = resourceUriParts[subscriptionIndex + 1];
    }

    const resourceGroupIndex = resourceUriParts.indexOf('resourcegroups');
    if (resourceGroupIndex > -1) {
      output.ResourceGroup = resourceUriParts[resourceGroupIndex + 1];
    }

    const nameIndex = resourceUriParts.indexOf('components');
    if (nameIndex > -1) {
      output.Name = resourceUriParts[nameIndex + 1];
    }
    return output;
  }
}
