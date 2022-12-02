import {
  Component,
  Input,
  Output,
  OnChanges,
  EventEmitter
} from '@angular/core';
import {
  IAppAnalysisResponse,
  IAbnormalTimePeriod
} from '../../models/appanalysisresponse';

@Component({
  selector: 'downtime-timeline',
  templateUrl: 'downtime-timeline.component.html',
  styleUrls: ['downtime-timeline.component.scss']
})
export class DowntimeTimelineComponent implements OnChanges {
  downtimeDisplayInfo: any[];

  startTimeString: string;
  endTimeString: string;

  constructor() {
    this.downtimeDisplayInfo = [];
  }

  @Input() appAnalysisResponse: IAppAnalysisResponse;

  @Input() selectedDowntimeIndex: number;

  @Input() problemDescription: string;

  @Output() selectedDowntimeIndexChange: EventEmitter<number> =
    new EventEmitter<number>();

  ngOnChanges(changes: any): void {
    const self = this;
    if (changes['appAnalysisResponse']) {
      this.downtimeDisplayInfo = [];
      const response = this.appAnalysisResponse;
      if (response && response.abnormalTimePeriods) {
        const startTime = new Date(response.startTime);
        const endTime = new Date(response.endTime);

        const fullDuration = endTime.getTime() - startTime.getTime();

        let currentStart = new Date(startTime);
        let abnormalTimePeriodCount = 0;
        let totalPercent = 0;
        response.abnormalTimePeriods.forEach(
          (downtime: IAbnormalTimePeriod) => {
            let width =
              ((new Date(downtime.startTime).getTime() -
                300000 -
                currentStart.getTime()) /
                fullDuration) *
              100;
            if (width > 0) {
              totalPercent += width;
              this.downtimeDisplayInfo.push({
                percent: width,
                isDowntime: false,
                index: -1
              });
            }

            width =
              ((new Date(downtime.endTime).getTime() -
                (new Date(downtime.startTime).getTime() - 300000)) /
                fullDuration) *
              100;
            width = totalPercent + width > 100 ? 100 - totalPercent : width;
            totalPercent += width;

            this.downtimeDisplayInfo.push({
              percent: width,
              isDowntime: true,
              index: abnormalTimePeriodCount++
            });
            currentStart = new Date(new Date(downtime.endTime).getTime());
          }
        );

        if (currentStart < endTime) {
          let width =
            ((endTime.getTime() - currentStart.getTime()) / fullDuration) * 100;
          width = totalPercent + width > 100 ? 100 - totalPercent : width;
          totalPercent += width;
          this.downtimeDisplayInfo.push({
            percent: width,
            isDowntime: false,
            index: -1
          });
        }

        if (response.abnormalTimePeriods.length > 0) {
          this.setStartAndEndTimeStrings();
        }
      }
    }
  }

  protected setStartAndEndTimeStrings() {
    this.startTimeString = this.formatDateTime(
      new Date(
        this.appAnalysisResponse.abnormalTimePeriods[
          this.selectedDowntimeIndex
        ].startTime
      )
    );
    this.endTimeString = this.formatDateTime(
      new Date(
        this.appAnalysisResponse.abnormalTimePeriods[
          this.selectedDowntimeIndex
        ].endTime
      )
    );
  }

  protected formatDateTime(datetime: Date): string {
    // TODO: this is a hack and there has to be a better way
    const hours = datetime.getUTCHours();
    const hoursString = hours < 10 ? '0' + hours : hours;
    const minutes = datetime.getUTCMinutes();
    const minutesString = minutes < 10 ? '0' + minutes : minutes;
    return (
      datetime.getUTCMonth() +
      1 +
      '/' +
      datetime.getUTCDate() +
      ' ' +
      hoursString +
      ':' +
      minutesString +
      ' UTC'
    );
  }

  selectDowntime(identifier: number): void {
    if (identifier >= 0) {
      this.setStartAndEndTimeStrings();
      this.selectedDowntimeIndex = identifier;
      this.selectedDowntimeIndexChange.emit(identifier);
    }
  }

  private inIFrame(): boolean {
    return window.parent !== window;
  }
}
