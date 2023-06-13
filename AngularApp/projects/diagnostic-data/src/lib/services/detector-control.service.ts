import { Injectable, Inject } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../config/diagnostic-data-config';
import { TimeUtilities } from '../utilities/time-utilities';


@Injectable()
export class DetectorControlService {

  readonly stringFormat: string = TimeUtilities.fullStringFormat;

  durationSelections: DurationSelector[] = [
    { displayName: TimePickerOptions.Last1Hour, duration: moment.duration(1, 'hours'), internalOnly: false, ariaLabel: "1 Hour" },
    { displayName: TimePickerOptions.Last6Hours, duration: moment.duration(6, 'hours'), internalOnly: false, ariaLabel: "6 Hours" },
    { displayName: TimePickerOptions.Last12Hour, duration: moment.duration(12, 'hours'), internalOnly: false, ariaLabel: "12 Hour" },
    { displayName: TimePickerOptions.Last24Hours, duration: moment.duration(1, 'day'), internalOnly: false, ariaLabel: "24 Hour" },
    { displayName: TimePickerOptions.Last3Days, duration: moment.duration(3, 'days'), internalOnly: true, ariaLabel: "3 Days" }
  ];

  private _duration: DurationSelector;
  private _startTime: moment.Moment;
  private _endTime: moment.Moment;

  private _internalView = true;

  public internalClient: boolean = false;

  private _error: string;

  private _shouldRefresh: boolean;

  private _refresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  public _effectiveLocale: string = "";

  private detectorQueryParams: BehaviorSubject<string> = new BehaviorSubject<string>("");

  public _refreshInstanceId: BehaviorSubject<string> = new BehaviorSubject<string>("");

  public DetectorQueryParams = this.detectorQueryParams.asObservable();

  public timeRangeDefaulted: boolean = false;
  public timeRangeErrorString: string = '';
  public allowedDurationInDays: number = 1;

  public timePickerInfoSub: BehaviorSubject<TimePickerInfo> = new BehaviorSubject<TimePickerInfo>({
    selectedKey: TimePickerOptions.Last24Hours,
    selectedText: TimePickerOptions.Last24Hours,
    startMoment: moment.utc().subtract(24, 'hours'),
    endMoment: moment.utc().subtract(15, 'minute')
  });

  public changeFromTimePicker: boolean = false;

  public timePickerStrSub: BehaviorSubject<string> = new BehaviorSubject(TimePickerOptions.Last24Hours);

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.internalClient = !config.isPublic;
    this.allowedDurationInDays = this.internalClient ? 3 : 1;
    this._duration = this.durationSelections.find(d => d.displayName === TimePickerOptions.Last24Hours);
    this._startTime = moment.utc().subtract(this._duration.duration);
    this._endTime = this.currentUTCMoment;
  }

  public get update() {
    return this._refresh;
  }

  public get currentUTCMoment() {
    return moment.utc().subtract(16, 'minutes');
  }

  public setDefault() {
    this.selectDuration(this.durationSelections.find(d => d.displayName === TimePickerOptions.Last24Hours));
  }


  public setCustomStartEnd(start?: string, end?: string, refreshInstanceId?: string): void {
    const { startMoment, endMoment, errorMessage, adjustMessage } = this.getMessageAndAutoAdjust(start, end);
    this.timeRangeErrorString = `${errorMessage} ${adjustMessage}`;
    this.setCustomStartEndAfterValidation(startMoment, endMoment, refreshInstanceId);
  }

  public setCustomStartEndAfterValidation(startMoment: moment.Moment, endMoment: moment.Moment, refreshInstanceId?: string) {
    this._startTime = startMoment;
    this._endTime = endMoment;
    if (!refreshInstanceId) {
      this._refreshData("V3ControlRefresh");
    }
  }

  private validateTimeInput(time: string, type: TimeType): TimeErrorType {
    const m = moment.utc(time);

    if (!time) {
      return TimeErrorType.EmptyInput;
    }

    if (!m.isValid()) {
      return TimeErrorType.InvalidFormat;
    }

    const { minMoment, maxMoment } = this.getMinAndMaxMoment(type, moment.duration(15, 'minutes'));

    if (!m.isBetween(minMoment, maxMoment,"minute","[]")) {
      return TimeErrorType.TimeOutOfRange;
    }
    return TimeErrorType.None;
  }

  private validateTimeRange(startMoment: moment.Moment, endMoment: moment.Moment): TimeErrorType {
    const diffInMinute = endMoment.diff(startMoment,"minute");

    if (diffInMinute > this.allowedDurationInDays * 24 * 60) {
      return TimeErrorType.TimeRangeTooLong;
    }

    if (diffInMinute < 15) {
      return TimeErrorType.TimeRangeTooShort;
    }
    return TimeErrorType.None;
  }


  private getErrorMessageByType(errorType: TimeErrorType, timeType?: TimeType) {
    const timePlaceholder = timeType ? timeType : "time";
    switch (errorType) {
      case TimeErrorType.EmptyInput:
        return `Empty ${timePlaceholder} supplied.`;
      case TimeErrorType.InvalidFormat:
        return `Invalid ${timePlaceholder} time specified, expected format: ${this.stringFormat}.`;
      case TimeErrorType.TimeOutOfRange:
        const { minMoment, maxMoment } = this.getMinAndMaxMoment(timeType, moment.duration(15, 'minutes'));
        return`${timePlaceholder} is not allowed, time must within ${minMoment.format(this.stringFormat)} to ${maxMoment.format(this.stringFormat)}.`;
      case TimeErrorType.TimeRangeTooShort:
        return "Selected time duration must be at least 15 minutes.";
      case TimeErrorType.TimeRangeTooLong:
        return `Selected time duration must be no more than ${this.allowedDurationInDays * 24} hours.`;
      case TimeErrorType.None:
      default:
        return "";
    }
  }

  public getMessageAndAutoAdjust(startTime: string, endTime: string): { startMoment: moment.Moment, endMoment: moment.Moment, errorMessage: string, adjustMessage: string } {
    const defaultDuration = moment.duration(1, 'day');
    let adjustMessage = "";
    let errorMessage = "";
    let startMoment = moment.utc().subtract(1, 'day');
    let endMoment = moment.utc().subtract(15, 'minutes');

    const startTimeError = this.validateTimeInput(startTime, TimeType.StartTime);
    const endTimeError = this.validateTimeInput(endTime, TimeType.EndTime);

    const startTimeErrorMessage = this.getErrorMessageByType(startTimeError, TimeType.StartTime);
    const endTimeErrorMessage = this.getErrorMessageByType(endTimeError, TimeType.EndTime);

    if (startTimeError !== TimeErrorType.None && endTimeError !== TimeErrorType.None) {
      errorMessage = `${startTimeErrorMessage} ${endTimeErrorMessage}`;
      adjustMessage = "Adjust to last 24 hours.";
      return { startMoment: startMoment, endMoment: endMoment, errorMessage, adjustMessage };
    } else if (startTimeError !== TimeErrorType.None) {
      const { minMoment } = this.getMinAndMaxMoment(TimeType.EndTime, defaultDuration);
      const needAdjustEndTime = moment.utc(endTime).isBefore(minMoment);
      endMoment = needAdjustEndTime ? minMoment : moment.utc(endTime);
      startMoment = endMoment.clone().subtract(defaultDuration);
      errorMessage = startTimeErrorMessage;
      adjustMessage = needAdjustEndTime ? "Adjust start and end time." : "Adjust start time to one day before end time";
      return { startMoment: startMoment, endMoment: endMoment, errorMessage, adjustMessage };
    } else if (endTimeError !== TimeErrorType.None) {
      const { maxMoment } = this.getMinAndMaxMoment(TimeType.StartTime, defaultDuration);
      const needAdjustStartTime = moment.utc(startTime).isAfter(maxMoment);
      startMoment = needAdjustStartTime ? maxMoment : moment.utc(startTime);
      endMoment = startMoment.clone().add(defaultDuration);
      errorMessage = endTimeErrorMessage;
      adjustMessage = needAdjustStartTime ? "Adjust start and end time." : "Adjust end time to one day after start time";
      return { startMoment: startMoment, endMoment: endMoment, errorMessage, adjustMessage };
    }

    startMoment = moment.utc(startTime);
    endMoment = moment.utc(endTime);

    const timeRangeError = this.validateTimeRange(startMoment, endMoment);
    errorMessage = this.getErrorMessageByType(timeRangeError);

    if (timeRangeError === TimeErrorType.None) {
      return { startMoment: startMoment.clone(), endMoment: endMoment.clone(), errorMessage: "", adjustMessage: "" };
    }

    let durationToAdjust = moment.duration(24, 'hours');
    adjustMessage = "Adjust Time range to 24 hours.";
    if (timeRangeError === TimeErrorType.TimeRangeTooShort) {
      durationToAdjust = moment.duration(15, 'minutes');
      adjustMessage = "Adjust Time range to 15 minutes."
    } else if (timeRangeError === TimeErrorType.TimeRangeTooLong) {
      durationToAdjust = moment.duration(this.allowedDurationInDays * 24, 'hours');
      adjustMessage = `Adjust time range to ${this.allowedDurationInDays * 24} hours.`;
    }
    const { minMoment } = this.getMinAndMaxMoment(TimeType.EndTime, durationToAdjust);
    endMoment = moment.max(minMoment, endMoment);
    startMoment = endMoment.clone().subtract(durationToAdjust);
    return { startMoment: startMoment, endMoment: endMoment, errorMessage, adjustMessage };

  }

  private getMinAndMaxMoment(type: TimeType, duration: moment.Duration) {
    let minMoment: moment.Moment;
    let maxMoment: moment.Moment;
    if (type === TimeType.StartTime) {
      minMoment = moment.utc().subtract(30, 'days');
      maxMoment = moment.utc().subtract(15, 'minutes').subtract(duration);
    } else if (type === TimeType.EndTime) {
      minMoment = moment().utc().subtract(30, 'days').add(duration);
      maxMoment = moment().utc().subtract(15, 'minute');
    }
    return { minMoment, maxMoment }
  }

  public selectDuration(duration: DurationSelector) {
    this._duration = duration;
    this._startTime = moment.utc().subtract(duration.duration);
    this._endTime = moment.utc().subtract(15, 'minute');
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
    this._refreshData(instanceId);
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

  public get startTime(): moment.Moment { return (this._startTime ? this._startTime.clone() : this._startTime); }

  public get endTime(): moment.Moment { return (this._endTime ? this._endTime.clone() : this._endTime); }

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
  duration: moment.Duration;
  internalOnly: boolean;
  ariaLabel: string
}

export interface TimePickerInfo {
  selectedKey: string,
  selectedText: string,
  startMoment?: moment.Moment,
  endMoment?: moment.Moment,
}

export enum TimePickerOptions {
  Last1Hour = "Last 1 Hour",
  Last6Hours = "Last 6 Hours",
  Last12Hour = "Last 12 Hours",
  Last24Hours = "Last 24 Hours",
  Last3Days = "Last 3 Days",
  Custom = "Custom"
}

enum TimeType {
  StartTime = "Start Time",
  EndTime = "End Time",
}

enum TimeErrorType {
  None,
  EmptyInput,
  InvalidFormat,
  TimeOutOfRange,
  TimeRangeTooShort,
  TimeRangeTooLong
}