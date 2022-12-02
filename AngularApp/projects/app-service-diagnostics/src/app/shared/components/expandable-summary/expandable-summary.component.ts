import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  SimpleChange
} from '@angular/core';
import { IMetricSet } from '../../models/detectorresponse';
import {
  SummaryViewModel,
  SummaryHealthStatus
} from '../../models/summary-view-model';
import { ChartType } from '../../models/chartdata';
import { BehaviorSubject } from 'rxjs';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { LoadingStatus } from 'diagnostic-data';

@Component({
  selector: 'expandable-summary',
  templateUrl: 'expandable-summary.component.html',
  styleUrls: ['expandable-summary.component.scss']
})
export class ExpandableSummaryComponent implements OnInit, OnChanges {
  LoadingStatus = LoadingStatus;

  healthStatus: any = SummaryHealthStatus;
  lineChart: ChartType = ChartType.lineChart;

  summaryModel: SummaryViewModel;
  expanded: boolean = false;
  metricsContainData: boolean = false;

  mainMetricSets: IMetricSet[];
  detailMetricSets: IMetricSet[];

  markupString: string;

  @Input() title: string;

  @Input() refreshing: boolean = false;

  private _summaryViewModelSubject: BehaviorSubject<SummaryViewModel> =
    new BehaviorSubject<SummaryViewModel>(null);

  @Input() set summaryViewModel(value: SummaryViewModel) {
    this._summaryViewModelSubject.next(value);
  }

  constructor(private _logger: AvailabilityLoggingService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['summaryViewModel']) {
      const _changedSummaryViewModel: SimpleChange = changes.summaryViewModel;
      if (
        _changedSummaryViewModel.currentValue &&
        _changedSummaryViewModel.previousValue
      ) {
        this.summaryModel = null;
        this.mainMetricSets = null;
        this.detailMetricSets = null;
        this.expanded = false;
        this.metricsContainData = false;
        this._summaryViewModelSubject.next(
          _changedSummaryViewModel.currentValue
        );
      }
    }
  }

  ngOnInit(): void {
    this._summaryViewModelSubject.subscribe((value) => {
      if (value) {
        this.summaryModel = value;
        this.mainMetricSets = this.summaryModel.mainMetricSets;
        this.detailMetricSets = this.summaryModel.detailMetricSets;

        this.mainMetricSets.forEach((element) => {
          if (element.values.length > 0) {
            this.metricsContainData = true;
          }
        });

        const abnormalTimePeriod = this.summaryModel.detectorAbnormalTimePeriod;
        if (abnormalTimePeriod && abnormalTimePeriod.metaData.length > 0) {
          const markupStringNameValuePair = abnormalTimePeriod.metaData[0].find(
            (x) => x.name === 'MarkupString'
          );
          this.markupString = markupStringNameValuePair
            ? markupStringNameValuePair.value
            : null;
        }
      }
    });
  }

  toggleExpanded(): void {
    if (this.summaryModel) {
      this._logger.LogSummaryViewExpanded(
        this.summaryModel.detectorName,
        this.summaryModel.health
      );
    }

    this.expanded = !this.expanded;
  }
}
