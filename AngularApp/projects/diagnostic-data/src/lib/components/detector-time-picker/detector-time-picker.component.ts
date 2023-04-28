import { Component, OnInit, Output, Input, EventEmitter, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICalendarStrings, IDatePickerProps, IChoiceGroupOption, ITextFieldStyles } from 'office-ui-fabric-react';
import * as moment from 'moment';
import { DetectorControlService, TimePickerInfo, TimePickerOptions } from '../../services/detector-control.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { Observable } from 'rxjs';
import { UriUtilities } from '../../utilities/uri-utilities';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { TimeUtilities } from '../../utilities/time-utilities';


@Component({
  selector: 'detector-time-picker',
  templateUrl: './detector-time-picker.component.html',
  styleUrls: ['./detector-time-picker.component.scss']
})
export class DetectorTimePickerComponent implements OnInit {
  @Input() openTimePickerCalloutObservable: Observable<boolean>;
  openTimePickerCallout: boolean = false;
  @Input() target: string = "";
  @Input() disableUpdateQueryParams: boolean = false;
  @Output() updateTimerErrorMessage: EventEmitter<string> = new EventEmitter();
  timePickerButtonStr: string = "";
  showCalendar: boolean = false;
  selectedKey: string;
  get disableDateAndTimePicker() {
    return this.selectedKey !== TimePickerOptions.Custom;
  }

  maxDate: Date = TimeUtilities.convertMomentInUTCToDateAndTime(this.detectorControlService.currentUTCMoment).date;
  minDate: Date = TimeUtilities.convertMomentInUTCToDateAndTime(moment.utc().subtract(30, 'days')).date;

  startDate: Date;
  endDate: Date;

  startClock: string;
  endClock: string;
  timeDiffError: string = "";

  isPublic: boolean = true;

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    //only this format can do both fill in date and select date
    return TimeUtilities.formatDate(date);
  };

  parseDateFromString: IDatePickerProps['parseDateFromString'] = (s) => {
    return TimeUtilities.passDateFromString(s);
  }


  choiceGroupOptions: IChoiceGroupOption[] = [];

  dayPickerString: ICalendarStrings = {
    months:
      [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],

    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    shortDays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],

    goToToday: 'Go to today',
    weekNumberFormatString: 'Week number {0}',
  };

  maskTextFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: "75px" } };

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private activatedRoute: ActivatedRoute, private detectorControlService: DetectorControlService, private router: Router, private telemetryService: TelemetryService) {
    this.isPublic = config && config.isPublic;
  }

  ngOnInit() {
    this.choiceGroupOptions = this.detectorControlService.durationSelections.filter(selection => !this.isPublic || !selection.internalOnly).map(selection => <IChoiceGroupOption>{
      key: selection.displayName,
      text: selection.displayName,
      onClick: () => this.setTime(selection.displayName)
    }).concat([{
      key: TimePickerOptions.Custom,
      text: TimePickerOptions.Custom,
      onClick: () => this.selectCustom()
    }]);

    this.openTimePickerCalloutObservable.subscribe(o => {
      this.openTimePickerCallout = o;
    });

    this.updateTimerErrorMessage.emit(this.detectorControlService.timeRangeErrorString);

    this.detectorControlService.timePickerInfoSub.subscribe(timerPickerInfo => {
      const option = this.choiceGroupOptions.find(option => timerPickerInfo.selectedKey === option.key);
      this.selectedKey = option.key;
      if (timerPickerInfo.selectedKey === TimePickerOptions.Custom) {
        const startTimeAndDate = TimeUtilities.convertMomentInUTCToDateAndTime(timerPickerInfo.startMoment);
        const endTimeAndDate = TimeUtilities.convertMomentInUTCToDateAndTime(timerPickerInfo.endMoment);

        this.startDate = startTimeAndDate.date;
        this.startClock = startTimeAndDate.time;
        this.endDate = endTimeAndDate.date;
        this.endClock = endTimeAndDate.time;
      } else {
        //Trigger setTime function 
        option.onClick.apply(this);
      }
    });


    let count = 0;
    this.detectorControlService.update.subscribe(validUpdate => {
      //Only showing error message on <detector-view> in the first time
      if (count > 0) this.updateTimerErrorMessage.emit("");
      count += 1;

      let queryParams = { ...this.activatedRoute.snapshot.queryParams };
      const isSameStartAndEndTime = this.checkParamIsSameAsMoment(queryParams["startTime"], this.detectorControlService.startTime) && this.checkParamIsSameAsMoment(queryParams["endTime"], this.detectorControlService.endTime);
      if (this.detectorControlService.startTime && this.detectorControlService.endTime) {
        queryParams["startTime"] = this.detectorControlService.startTimeString;
        queryParams["endTime"] = this.detectorControlService.endTimeString;
      }
      if (this.detectorControlService.changeFromTimePicker) {
        queryParams = UriUtilities.removeChildDetectorStartAndEndTime(queryParams);
      }

      if (!this.disableUpdateQueryParams && !isSameStartAndEndTime) {
        this.router.navigate([], { queryParams: queryParams, relativeTo: this.activatedRoute }).then((_) => {
          this.detectorControlService.changeFromTimePicker = false;
        });
      }
    });
  }

  setTime(key: string) {
    this.selectedKey = key;
    this.timeDiffError = '';
    const duration = this.detectorControlService.durationSelections.find(d => d.displayName === key).duration;
    const endUTC = this.detectorControlService.currentUTCMoment;
    const startUTC = moment.utc().subtract(duration);
    const startDateAndTime = TimeUtilities.convertMomentInUTCToDateAndTime(startUTC);
    const endDateAndTime = TimeUtilities.convertMomentInUTCToDateAndTime(endUTC);

    this.startDate = startDateAndTime.date;
    this.startClock = startDateAndTime.time;

    this.endDate = endDateAndTime.date;
    this.endClock = endDateAndTime.time;
  }



  //Click outside or tab to next component
  closeTimePicker() {
    this.openTimePickerCallout = false;
  }

  //Press Escape,Click Cancel
  cancelTimeRange() {
    this.closeTimePicker();
  }

  //clickHandler for apply button
  applyTimeRange() {
    this.detectorControlService.changeFromTimePicker = true;

    const { startMoment, endMoment } = this.validateStartAndEndTime();

    const timePickerInfo: TimePickerInfo = {
      selectedKey: this.selectedKey,
      selectedText: this.selectedKey,
      startMoment: startMoment,
      endMoment: endMoment
    }


    if (this.timeDiffError === '') {
      this.detectorControlService.setCustomStartEndAfterValidation(startMoment, endMoment);
      this.detectorControlService.updateTimePickerInfo(timePickerInfo);
      this.updateTimerErrorMessage.emit("");
    }
    this.openTimePickerCallout = this.timeDiffError !== "";

    this.telemetryService.logEvent(TelemetryEventNames.TimePickerApplied, {
      'Title': timePickerInfo.selectedKey,
      'StartTime': startMoment.format(this.detectorControlService.stringFormat),
      'EndTime': endMoment.format(this.detectorControlService.stringFormat)
    });
  }

  validateStartAndEndTime() {
    const startMoment = TimeUtilities.convertDateAndTimeToUTCMoment(this.startDate, this.startClock);
    const endMoment = TimeUtilities.convertDateAndTimeToUTCMoment(this.endDate, this.endClock);

    const startTimeString = startMoment.format(this.detectorControlService.stringFormat);
    const endTimeString = endMoment.format(this.detectorControlService.stringFormat);

    this.timeDiffError = this.detectorControlService.getMessageAndAutoAdjust(startTimeString, endTimeString).errorMessage;
    return { startMoment, endMoment };
  }

  onSelectStartDateHandler(e: { date: Date }) {
    this.startDate = e.date;
    this.updateEndDateAndTime();
  }
  onSelectEndDateHandler(e: { date: Date }) {
    this.endDate = e.date;
  }


  private checkParamIsSameAsMoment(param: string, inputMoment: moment.Moment): boolean {
    const m = moment.utc(param);
    return m.isSame(inputMoment);
  }


  //when click LastXX hours,prefill into custom input, should be UTC time
  selectCustom() {
    this.selectedKey = TimePickerOptions.Custom;
    this.timeDiffError = "";
  }


  onChangeStartClock(value: string) {
    this.startClock = value;
    this.updateEndDateAndTime();
  }

  private validateClockInput(value: string) {
    const hour = Number.parseInt(value.split(":")[0]);
    const minute = Number.parseInt(value.split(":")[1]);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return false;
    return hour <= 24 && minute <= 59
  }

  escapeHandler(e: KeyboardEvent) {
    //If not enter date or time,ESC will close time picker
    const ele = (<HTMLElement>e.target);
    if (!ele.className.includes('ms-TextField-field')) {
      this.cancelTimeRange();
    }
  }

  tabHandler(e: KeyboardEvent) {
    const ele = <HTMLElement>e.target;
    //Tab to Cancel button will close
    if (ele.innerText.toLowerCase() === 'cancel') {
      this.closeTimePicker();
    }
  }

  //Change end date to startDate + 1
  private updateEndDateAndTime() {
    if (!this.validateClockInput(this.startClock)) return;

    const currentMoment = this.detectorControlService.currentUTCMoment;
    const startMoment = TimeUtilities.convertDateAndTimeToUTCMoment(this.startDate, this.startClock);
    const plusOneDayMoment = startMoment.add(1, 'day').clone();

    const endMoment = moment.min(currentMoment, plusOneDayMoment);

    const endDateAndTime = TimeUtilities.convertMomentInUTCToDateAndTime(endMoment);
    this.endDate = endDateAndTime.date;
    this.endClock = endDateAndTime.time
  }
}
