import { Injectable, Inject } from '@angular/core';
import * as momentNs from 'moment';
import { BehaviorSubject } from 'rxjs';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../config/diagnostic-data-config';

const moment = momentNs;

@Injectable()
export class DetectorControlService {

  readonly stringFormat: string = 'YYYY-MM-DD HH:mm';

  durationSelections: DurationSelector[] = [
    {
      displayName: '1h',
      duration: momentNs.duration(1, 'hours'),
      internalOnly: false,
      ariaLabel: "1 Hour"
    },
    {
      displayName: '6h',
      duration: momentNs.duration(6, 'hours'),
      internalOnly: false,
      ariaLabel: "6 Hours"
    },
    {
      displayName: '1d',
      duration: momentNs.duration(1, 'days'),
      internalOnly: false,
      ariaLabel: "1 Day"
    },
    {
      displayName: '3d',
      duration: momentNs.duration(3, 'days'),
      internalOnly: true,
      ariaLabel: "3 Days"
    }
  ];

  private _duration: DurationSelector;
  private _startTime: momentNs.Moment;
  private _endTime: momentNs.Moment;

  // TODO: allow for this to be changed with dropdown
  private _internalView = true;

  public internalClient: boolean = false;

  private _error: string;

  private _shouldRefresh: boolean;

  private _refresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  public _effectiveLocale: string="";

  private detectorQueryParams: BehaviorSubject<string> = new BehaviorSubject<string>("");

  public _refreshInstanceId: BehaviorSubject<string> = new BehaviorSubject<string>("");

  public DetectorQueryParams = this.detectorQueryParams.asObservable();

  public timeRangeDefaulted: boolean = false;
  public timeRangeErrorString: string = '';
  public allowedDurationInDays: number = 1;

  public timePickerInfoSub: BehaviorSubject<TimePickerInfo> = new BehaviorSubject<TimePickerInfo>({
    selectedKey: TimePickerOptions.Last24Hours,
    selectedText: TimePickerOptions.Last24Hours
  });

  public changeFromTimePicker:boolean = false;

  public timePickerStrSub: BehaviorSubject<string> = new BehaviorSubject(TimePickerOptions.Last24Hours);

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.internalClient = !config.isPublic;
    this._duration = this.durationSelections[2];
    this._startTime = moment.utc().subtract(this._duration.duration);
    this._endTime = moment.utc().subtract(15,'minute');
  }

  public get update() {
    return this._refresh;
  }

  public setDefault() {
    this.selectDuration(this.durationSelections.find(duration => duration.displayName === '1d'));
  }

  public getTimeDurationError(startTime?: string, endTime?: string): string {
    let start, end: momentNs.Moment;
    let returnValue: string = '';
    this.timeRangeDefaulted = false;
    this.timeRangeErrorString = '';
    let timeStringFormat = this.internalClient ? "YYYY-MM-DD hh:mm" : "MM/DD/YY hh:mm"
    if (startTime && endTime) {
      start = moment.utc(startTime);
      if (!start.isValid()) {
        returnValue = `Invalid Start date time specified. Expected format: ${timeStringFormat}`;
        this.timeRangeErrorString = returnValue;
        return returnValue;
      }
      end = moment.utc(endTime);
      if (!end.isValid()) {
        returnValue = `Invalid End date time specified. Expected format: ${timeStringFormat}`;
        this.timeRangeErrorString = returnValue;
        return returnValue;
      }
      if (moment.duration(moment.utc().diff(start)).asMinutes() < 30) {
        returnValue = 'Start date time must be 30 minutes less than current date time';
        this.timeRangeErrorString = returnValue;
        return returnValue;
      }
      if (moment.duration(moment.utc().diff(end)).asMinutes() < 15) {
        returnValue = 'End date time must be 15 minutes less than current date time';
        this.timeRangeErrorString = returnValue;
        return returnValue;
      }

      if (this.internalClient) {
        this.allowedDurationInDays = 3;
      }
      else {
        this.allowedDurationInDays = 1;
      }
      if (start && end) {
        let diff: momentNs.Duration = moment.duration(end.diff(start));
        let dayDiff: number = diff.asDays();
        if (dayDiff > -1) {
          if (dayDiff > this.allowedDurationInDays) {
            returnValue = `Difference between start and end date times should not be more than ${(this.allowedDurationInDays * 24).toString()} hours.`;
          }
          else {
            //Duration is fine. Just make sure that the start date is not more than the past 30 days
            if (moment.duration(moment.utc().diff(start)).asDays() > 30) {
              returnValue = `Start date time cannot be more than 30 days from now.`;
            }
            else {
              if (diff.asMinutes() === 0) {
                returnValue = 'Start and End date time cannot be the same.';
              }
              else {
                if (diff.asMinutes() < 15) {
                  returnValue = 'Selected time duration must be at least 15 minutes.';
                }
                else {
                  returnValue = '';
                }
              }
            }
          }
        }
        else {
          returnValue = 'Start date time should be greater than the End date time.';
        }
      }
      this.timeRangeErrorString = returnValue;
      return returnValue;
    }
    else {
      if (startTime) {
        start = moment.utc(startTime);
        if (!start.isValid()) {
          returnValue = `Invalid Start date time specified. Expected format: ${timeStringFormat}`;
          this.timeRangeErrorString = returnValue;
          return returnValue;
        }
        else {
          returnValue = 'Empty End date time supplied.';
        }
      }
      else {
        returnValue = 'Empty Start date time supplied.';
      }
    }
    this.timeRangeErrorString = returnValue;
    return returnValue;
  }

  public setCustomStartEnd(start?: string, end?: string, refreshInstanceId?: string): void {
    this.timeRangeDefaulted = false;
    this._duration = null;
    let startTime, endTime: momentNs.Moment;
    if (start && end) {
      startTime = moment.utc(start);
      if (moment.duration(moment.utc().diff(moment.utc(end))).asMinutes() < 16) {
        //The supplied end time > now - 15 minutes. Adjust the end time so that it becomes now()-15 minutes.
        endTime = moment.utc().subtract(16, 'minutes');
      }
      else {
        endTime = moment.utc(end);
      }

    } else if (start) {
      startTime = moment.utc(start);
      if (moment.duration(moment.utc().diff(startTime.clone().add(1, 'days'))).asMinutes() < 16) {
        //No endtime was passed. If (start time + 1 day) > (now() - 15 minutes), adjust the end time so that it becomes less than now()-15 minutes.
        endTime = moment.utc().subtract(16, 'minutes');
      }
      else {
        endTime = startTime.clone().add(1, 'days');
      }
    } else if (end) {
      if (moment.duration(moment.utc().diff(moment.utc(end))).asMinutes() < 16) {
        //The supplied end time > now - 15 minutes. Adjust the end time so that it becomes now()-15 minutes.
        endTime = moment.utc().subtract(16, 'minutes');
      }
      else {
        endTime = moment.utc(end);
      }

      startTime = endTime.clone().subtract(1, 'days');
    } else {
      this.selectDuration(this.durationSelections[2]);
      return;
    }

    if (this.getTimeDurationError(start, end) === '') {
      this._startTime = startTime;
      this._endTime = endTime;
      if (!refreshInstanceId)
      {
        this._refreshData("V3ControlRefresh");
      }
    }
    else {
      this.timeRangeDefaulted = true;
      if (this.timeRangeErrorString === 'Selected time duration must be at least 15 minutes.') {
        this.timeRangeErrorString = 'Time range set to a 15 minutes duration. Selected time duration was less than 15 minutes.';
        this._endTime = endTime;
        this._startTime = this._endTime.clone().subtract(15, 'minutes');
      }
      else {
        if (this.timeRangeErrorString === 'Empty End date time supplied.') {
          this._startTime = moment.utc(start);
          if (moment.duration(moment.utc().diff(this._startTime)).asMinutes() < 16) {
            this._startTime = moment.utc().subtract(30, 'minutes');
            this._endTime = this._startTime.clone().add(15, 'minutes');
            this.timeRangeErrorString += ' Auto adjusted Start and End date time.';
          }
          else {
            if (moment.duration(moment.utc().diff(this._startTime.clone().add(1, 'days'))).asMinutes() < 16) {
              this._endTime = moment.utc().subtract(16, 'minutes');
            }
            else {
              this._endTime = this._startTime.clone().add(1, 'days');
            }

            this.timeRangeErrorString += ' Auto adjusted End date time.';
          }
        }
        else {
          this.timeRangeErrorString = `Time range set to last 24 hrs. Start and End date time must not be more than ${(this.allowedDurationInDays * 24).toString()} hrs apart, Start date must be within the past 30 days and end date must be 15 minutes less than the current time.`;
          this._endTime = moment.utc().subtract(16, 'minutes');
          this._startTime = this._endTime.clone().subtract(1, 'days');
        }
      }
      this._refreshData("V3ControlRefresh");
    }
  }

  public selectDuration(duration: DurationSelector) {
    this._duration = duration;
    this._startTime = moment.utc().subtract(duration.duration);
    this._endTime = moment.utc().subtract(15,'minute');
    this.setCustomStartEnd(this._startTime.format(this.stringFormat), this.endTime.format(this.stringFormat));
  }

  public moveForwardDuration(): void {
    this._startTime.add(this._duration.duration);
    this._endTime.add(this._duration.duration);
    this.setCustomStartEnd(this._startTime.format(this.stringFormat), this.endTime.format(this.stringFormat));
  }

  public moveBackwardDuration(): void {
    this._startTime.subtract(this._duration.duration);
    this._endTime.subtract(this._duration.duration);
    this.setCustomStartEnd(this._startTime.format(this.stringFormat), this.endTime.format(this.stringFormat));
  }

  public refresh(instanceId: string = "") {
    this._duration ? this.selectDuration(this._duration) : this._refreshData(instanceId);
  }

  public toggleInternalExternal() {
    this._internalView = !this._internalView;
    this._refreshData();
  }

  public setDetectorQueryParams(detectorQueryParams: string) {
    this.detectorQueryParams.next(detectorQueryParams);
  }

  private _refreshData(instanceId: string = "") {
    this._shouldRefresh = true;
    this._refresh.next(true);
    this._refreshInstanceId.next(instanceId);
  }

  public get error(): string {
    return this._error;
  }

  public get startTime(): momentNs.Moment { return (this._startTime ? this._startTime.clone() : this._startTime); }

  public get endTime(): momentNs.Moment { return (this._endTime ? this._endTime.clone() : this._endTime); }

  public get duration(): DurationSelector { return this._duration; }

  public get startTimeString(): string { return this.startTime.format(this.stringFormat); }

  public get endTimeString(): string { return this.endTime.format(this.stringFormat); }

  public get isInternalView(): boolean { return this._internalView; }

  public get shouldRefresh(): boolean {
    const temp = this._shouldRefresh;
    this._shouldRefresh = false;
    return temp;
  }

  public get detectorQueryParamsString(): string {
    return this.detectorQueryParams.value;
  }

  public get effectiveLocale(): string {
      return this._effectiveLocale;
  }

  public updateTimePickerInfo(updatedInfo: TimePickerInfo) {
    this.timePickerInfoSub.next(updatedInfo);
    if (updatedInfo && updatedInfo.selectedKey !== TimePickerOptions.Custom) {
      this.timePickerStrSub.next(updatedInfo.selectedText);
    } else {
      const st = moment(this.startTimeString).format(this.stringFormat);
      const et = moment(this.endTimeString).format(this.stringFormat);
      this.timePickerStrSub.next(`${st} to ${et}`);
    }
  }
}

export interface DurationSelector {
  displayName: string;
  duration: momentNs.Duration;
  internalOnly: boolean;
  ariaLabel: string;
}

export interface TimePickerInfo {
  //if it is customized, then prefill with strart date and time
  selectedKey: string,
  selectedText: string,
  startDate?: Date,
  endDate?: Date,
}

export enum TimePickerOptions {
  Last1Hour = "Last 1 Hour",
  Last6Hours = "Last 6 Hours",
  Last12Hour = "Last 12 Hours",
  Last24Hours = "Last 24 Hours",
  Last3Days = "Last 3 Days",
  Custom = "Custom"
}
