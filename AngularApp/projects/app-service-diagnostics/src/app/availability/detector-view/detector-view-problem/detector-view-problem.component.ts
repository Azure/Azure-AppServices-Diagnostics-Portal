import { Component, OnInit, Input } from '@angular/core';
import {
  IDetectorResponse,
  IDetectorAbnormalTimePeriod,
  IMetricSet
} from '../../../shared/models/detectorresponse';
import { GraphHelper } from '../../../shared/utilities/graphHelper';
import { SolutionUIModelBase } from '../../../shared/models/solution-ui-model/solution-ui-model-base';
import { ISolution } from '../../../shared/models/solution';
import { SolutionFactory } from '../../../shared/models/solution-ui-model/solutionfactory';
import { ReplaySubject } from 'rxjs';
import { SiteService } from '../../../shared/services/site.service';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { AvailabilityLoggingService } from '../../../shared/services/logging/availability.logging.service';
declare let d3: any;

@Component({
  selector: 'detector-view-problem',
  templateUrl: 'detector-view-problem.component.html',
  styleUrls: ['../detector-view.scss']
})
export class DetectorViewProblemComponent implements OnInit {
  loading: boolean = true;
  private _detectorResponseSubject: ReplaySubject<IDetectorResponse> =
    new ReplaySubject<IDetectorResponse>(1);

  @Input() set detectorResponse(value: IDetectorResponse) {
    this._detectorResponseSubject.next(value);
  }

  @Input() detectorFriendlyName: string;
  @Input() isHealthyNow: boolean;
  @Input() highlightedDowntime: IDetectorAbnormalTimePeriod;

  @Input() showSolutions: boolean = true;

  downtimeMessage: string;
  downtimeTime: string;
  abnormalTimePeriods: IDetectorAbnormalTimePeriod[] = [];
  solutionUIModel: SolutionUIModelBase[] = [];
  messagesDisplayedToIndex = 3;

  constructor(
    private _siteService: SiteService,
    private _portalActionService: PortalActionService,
    private _logger: AvailabilityLoggingService
  ) {}

  ngOnInit(): void {
    if (this.highlightedDowntime) {
      this.isHealthyNow = false;
      this.abnormalTimePeriods.push(this.highlightedDowntime);

      let rank = 0;
      this.highlightedDowntime.solutions.forEach((solution: ISolution) => {
        let uiModel = SolutionFactory.getSolutionById(
          rank,
          solution.id,
          solution.data,
          this._siteService,
          this._portalActionService,
          this._logger
        );
        if (
          uiModel &&
          !this.solutionUIModel.find(
            (model) => model.properties.id === solution.id
          )
        ) {
          this.solutionUIModel.push(uiModel);
          rank++;
        }
      });
      this.loading = false;
    } else {
      this._detectorResponseSubject.subscribe(
        (detectorResponse: IDetectorResponse) => {
          if (detectorResponse) {
            if (detectorResponse.abnormalTimePeriods.length > 0) {
              let lastDowntime =
                detectorResponse.abnormalTimePeriods[
                  detectorResponse.abnormalTimePeriods.length - 1
                ];
              let lastDowntimeEndTime = new Date(lastDowntime.endTime);
              let detectorResponseEndTime = new Date(detectorResponse.endTime);
              let tenMinutesInMs = 600000;
              let rank = 0;

              this.isHealthyNow = !(
                lastDowntimeEndTime.getTime() + tenMinutesInMs >=
                detectorResponseEndTime.getTime()
              );
              this.abnormalTimePeriods.push(lastDowntime);

              if (!this.isHealthyNow) {
                lastDowntime.solutions.forEach((solution: ISolution) => {
                  let uiModel = SolutionFactory.getSolutionById(
                    rank,
                    solution.id,
                    solution.data,
                    this._siteService,
                    this._portalActionService,
                    this._logger
                  );
                  if (uiModel) {
                    this.solutionUIModel.push(uiModel);
                    rank++;
                  }
                });
              } else {
                detectorResponse.abnormalTimePeriods.forEach(
                  (element: IDetectorAbnormalTimePeriod) => {
                    element.solutions.forEach((solution: ISolution) => {
                      if (
                        this.solutionUIModel.findIndex(
                          (x: SolutionUIModelBase) =>
                            x.properties.id === solution.id
                        ) < 0
                      ) {
                        let uiModel = SolutionFactory.getSolutionById(
                          rank,
                          solution.id,
                          solution.data,
                          this._siteService,
                          this._portalActionService,
                          this._logger
                        );
                        if (uiModel) {
                          this.solutionUIModel.push(uiModel);
                          rank++;
                        }
                      }
                    });

                    this.abnormalTimePeriods = this.abnormalTimePeriods.sort(
                      (
                        a: IDetectorAbnormalTimePeriod,
                        b: IDetectorAbnormalTimePeriod
                      ) => {
                        return (
                          new Date(b.startTime).getTime() -
                          new Date(a.startTime).getTime()
                        );
                      }
                    );
                  }
                );
              }
            }
            this.loading = false;
          } else {
            this.abnormalTimePeriods = [];
            this.solutionUIModel = [];
            this.loading = true;
          }
        }
      );
    }
  }

  getSolutionTitle(): string {
    return 'Solutions for ' + this.detectorFriendlyName;
  }

  formatDate(dateString: string): string {
    var date = new Date(dateString);

    if (date.getTime() + 900000 > new Date().getTime()) {
      return 'Current';
    }

    return (
      date.getUTCMonth() +
      '/' +
      date.getUTCDate() +
      ' ' +
      (date.getUTCHours() < 10 ? '0' : '') +
      date.getUTCHours() +
      ':' +
      (date.getUTCMinutes() < 10 ? '0' : '') +
      date.getUTCMinutes() +
      ' UTC'
    );
  }
}
