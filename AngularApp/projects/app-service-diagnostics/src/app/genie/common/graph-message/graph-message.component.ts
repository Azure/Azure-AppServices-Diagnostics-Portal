import {
  Component,
  Injector,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { IMetricSet } from '../../../shared/models/detectorresponse';
import { Message } from '../../models/message';
import { ChartType } from '../../../shared/models/chartdata';
import { Observable, BehaviorSubject } from 'rxjs';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';

@Component({
  templateUrl: 'graph-message.component.html'
})
export class GraphMessageComponent
  implements OnInit, AfterViewInit, IChatMessageComponent
{
  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  loading: boolean = true;

  detectorMetrics: IMetricSet[];
  instanceDetailMetrics: IMetricSet[];

  data: GraphMessageData;

  detectorMetricsTitle: string;
  detectorMetricsDescription: string;
  instanceDetailTitle: string;
  instanceDetailDescription: string;

  metricsChartType: ChartType = ChartType.lineChart;

  constructor(
    private injector: Injector,
    private _logger: BotLoggingService,
    private _route: ActivatedRoute,
    private _appAnalysisService: AppAnalysisService
  ) {
    this.detectorMetricsTitle = 'Overall CPU Usage per Instance';
    this.detectorMetricsDescription =
      'This graphs shows the total CPU usage on each of the instances where your application is running. ' +
      'Below you can look at a specific instance and see how much CPU each app is consuming.';
    this.instanceDetailTitle = 'App CPU Usage Breakdown';
    this.instanceDetailDescription =
      'This shows the average CPU usage, in percent out of 100, for each application in the given time window.';
  }

  ngOnInit(): void {
    this.data = <GraphMessageData>this.injector.get('graphMessageData');

    this.detectorMetricsTitle = this.data.detectorMetricsTitle;
    this.detectorMetricsDescription = this.data.detectorMetricsDescription;
    this.instanceDetailTitle = this.data.instanceDetailTitle;
    this.instanceDetailDescription = this.data.instanceDetailDescription;
  }

  ngAfterViewInit(): void {
    this.data.detectorMetrics.subscribe((metrics) => {
      if (metrics) {
        this.onViewUpdate.emit();

        this.detectorMetrics = metrics;
        this.loading = false;

        this.onComplete.emit({
          status: true
        });
      }
    });

    this.data.instanceDetailMetrics.subscribe((metrics) => {
      if (metrics) {
        this.instanceDetailMetrics = metrics;
      }
    });
  }

  logInstanceSelected(event: any): void {
    //TODO
  }
}

export interface GraphMessageData {
  detectorMetricsTitle: string;
  detectorMetricsDescription: string;
  detectorMetrics: BehaviorSubject<IMetricSet[]>;
  instanceDetailTitle: string;
  instanceDetailDescription: string;
  instanceDetailMetrics: BehaviorSubject<IMetricSet[]>;
}

export class GraphMessage extends Message {
  constructor(data: GraphMessageData, messageDelayInMs: number = 500) {
    //TODO: add solution data
    super(GraphMessageComponent, { graphMessageData: data }, messageDelayInMs);
  }
}
