import { Component, OnInit, Output, Input, EventEmitter, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICalendarStrings, IDatePickerProps, IChoiceGroupOption, ITextFieldStyles } from 'office-ui-fabric-react';
import { addMonths, addDays } from 'office-ui-fabric-react/lib/utilities/dateMath/DateMath';
import * as momentNs from 'moment';
import { DetectorControlService, TimePickerInfo, TimePickerOptions } from '../../services/detector-control.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { Observable } from 'rxjs';
import { UriUtilities } from '../../utilities/uri-utilities';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';

const moment = momentNs;

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
  @Output() updateTimerMessage: EventEmitter<string> = new EventEmitter();
  timePickerButtonStr: string = "";
  showCalendar: boolean = false;
  showTimePicker: boolean = false;
  defaultSelectedKey: string;

  today: Date = new Date(Date.now());
  maxDate: Date = this.convertUTCToLocalDate(this.today);
  minDate: Date = this.convertUTCToLocalDate(addDays(this.today, -30));

  startDate: Date;
  endDate: Date;
  //set Last xx hours
  hourDiff: number;

  startClock: string;
  endClock: string;
  timeDiffError: string = "";

  isPublic: boolean = true;

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    //only this format can do both fill in date and select date
    console.log(date);
    return moment(date).format('YYYY-MM-DD');
  };

  parseDateFromString: IDatePickerProps['parseDateFromString'] = (s) => {
    const dateStr = s || "";
    const datePart = dateStr.split("-");
    const year = datePart[0].length > 0 ? Number.parseInt(datePart[0], 10) : this.endDate.getFullYear();
    const month = datePart[1].length > 0 ? Math.max(1, Math.min(12, parseInt(datePart[1], 10))) - 1 : this.endDate.getMonth();
    const date = datePart[2].length > 1 ? Math.max(1, Math.min(31, parseInt(datePart[2], 10))) : this.endDate.getDate();
    return new Date(year, month, date);
  }

  choiceGroupOptions: IChoiceGroupOption[] =
    [
      { key: TimePickerOptions.Last1Hour, text: TimePickerOptions.Last1Hour, onClick: () => { this.setTime(1) } },
      { key: TimePickerOptions.Last6Hours, text: TimePickerOptions.Last6Hours, onClick: () => { this.setTime(6) } },
      { key: TimePickerOptions.Last12Hour, text: TimePickerOptions.Last12Hour, onClick: () => { this.setTime(12) } },
      { key: TimePickerOptions.Last24Hours, text: TimePickerOptions.Last24Hours, onClick: () => { this.setTime(24) } },
      { key: TimePickerOptions.Custom, text: TimePickerOptions.Custom, onClick: () => { this.selectCustom() } },
    ];

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

  maskTextFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: "80px" } };

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private activatedRoute: ActivatedRoute, private detectorControlService: DetectorControlService, private router: Router, private telemetryService: TelemetryService) {
    this.isPublic = config && config.isPublic;
  }

  ngOnInit() {
    if (this.isPublic === false) {
      this.choiceGroupOptions.splice(4, 0, { key: TimePickerOptions.Last3Days, text: TimePickerOptions.Last3Days, onClick: () => { this.setTime(72) } });
    }
    this.startDate = addDays(this.today, -1);
    this.endDate = this.today;

    this.openTimePickerCalloutObservable.subscribe(o => {
      this.openTimePickerCallout = o;
    });
    this.detectorControlService.timePickerStrSub.subscribe(s => {
      this.updateTimerMessage.next(s);
    })


    this.detectorControlService.timePickerInfoSub.subscribe(timerPickerInfo => {
      const option = this.choiceGroupOptions.find(option => timerPickerInfo.selectedKey === option.key);
      this.defaultSelectedKey = option.key;
      //If it's customized then should default the option
      //If not customized then prefill start date and endDate
      if (timerPickerInfo.selectedKey === TimePickerOptions.Custom) {
        this.showTimePicker = true;
        this.startDate = timerPickerInfo.startDate;
        this.endDate = timerPickerInfo.endDate;

        //startDate and endDate contains current hour and minute info, only need HH:mm
        this.startClock = this.getHourAndMinute(timerPickerInfo.startDate);
        this.endClock = this.getHourAndMinute(timerPickerInfo.endDate);
      } else {
        //Trigger setTime function to set this.hourDiff
        option.onClick.apply(this);
      }
    });

    this.timeDiffError = '';
    if (this.detectorControlService.timeRangeDefaulted) {
      this.timeDiffError = this.detectorControlService.timeRangeErrorString;
    }

    this.detectorControlService.update.subscribe(validUpdate => {
      if (validUpdate) {
        //Todo, update custom prefill info
      }
      let queryParams = { ...this.activatedRoute.snapshot.queryParams };
      const isSameStartAndEndTime = this.checkParamIsSameAsMoment(queryParams["startTime"], this.detectorControlService.startTime) && this.checkParamIsSameAsMoment(queryParams["endTime"], this.detectorControlService.endTime);
      if (this.detectorControlService.startTime && this.detectorControlService.endTime) {
        queryParams["startTime"] = this.detectorControlService.startTime.format('YYYY-MM-DDTHH:mm');
        queryParams["endTime"] = this.detectorControlService.endTime.format('YYYY-MM-DDTHH:mm');
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

  setTime(hourDiff: number) {
    this.showTimePicker = false;
    this.timeDiffError = '';
    this.hourDiff = hourDiff;
  }

  //Click outside or tab to next component
  closeTimePicker() {
    this.openTimePickerCallout = false;
    this.showTimePicker = this.defaultSelectedKey === TimePickerOptions.Custom;
  }

  //Press Escape,Click Cancel
  cancelTimeRange() {
    this.closeTimePicker();
  }

  //clickHandler for apply button
  applyTimeRange() {
    this.detectorControlService.changeFromTimePicker = true;

    let startDateWithTime: string;
    let endDateWithTime: string;
    let timePickerInfo: TimePickerInfo;
    //customize
    if (this.showTimePicker) {
      startDateWithTime = this.convertDateTimeToString(this.startDate, this.startClock);
      endDateWithTime = this.convertDateTimeToString(this.endDate, this.endClock);
      //for timer picker, date and hour,minute
      let infoStartDate = new Date(this.startDate);
      infoStartDate.setHours(Number.parseInt(this.startClock.split(":")[0]), Number.parseInt(this.startClock.split(":")[1]));
      let infoEndDate = new Date(this.endDate);
      infoEndDate.setHours(Number.parseInt(this.endClock.split(":")[0]), Number.parseInt(this.endClock.split(":")[1]));
      timePickerInfo =
      {
        selectedKey: TimePickerOptions.Custom,
        selectedText: TimePickerOptions.Custom,
        startDate: infoStartDate,
        endDate: infoEndDate
      };
    } else {
      const currentDate = new Date();
      //End time should be less than 15 minute
      const localEndTime = new Date(currentDate.getTime() - 15 * 60 * 1000);
      const localStartTime = new Date(currentDate.getTime() - this.hourDiff * 60 * 60 * 1000);
      startDateWithTime = this.convertLocalDateToUTC(localStartTime);
      endDateWithTime = this.convertLocalDateToUTC(localEndTime);

      //find which option contains the hourDiff number
      const infoSelectOption = (this.hourDiff.toString() === '72') ? this.choiceGroupOptions.find(option => option.key.includes('3')) : this.choiceGroupOptions.find(option => option.key.includes(this.hourDiff.toString()))
      timePickerInfo = {
        selectedKey: infoSelectOption.key,
        selectedText: infoSelectOption.text
      };
    }

    this.timeDiffError = this.detectorControlService.getTimeDurationError(startDateWithTime, endDateWithTime);
    if (this.timeDiffError === '') {
      this.detectorControlService.setCustomStartEnd(startDateWithTime, endDateWithTime);
      this.detectorControlService.updateTimePickerInfo(timePickerInfo);
    }
    this.openTimePickerCallout = this.timeDiffError !== "";

    const eventProperties = {
      'Title': timePickerInfo.selectedKey
    }
    if (timePickerInfo.startDate) {
      const startTimeString = moment(timePickerInfo.startDate).format(this.detectorControlService.stringFormat);
      eventProperties['StartTime'] = startTimeString;
    }
    if (timePickerInfo.endDate) {
      const endTimeString = moment(timePickerInfo.startDate).format(this.detectorControlService.stringFormat);
      eventProperties['EndTime'] = endTimeString;
    }
    this.telemetryService.logEvent(TelemetryEventNames.TimePickerApplied, eventProperties);
  }

  onSelectStartDateHandler(e: { date: Date }) {
    this.startDate = e.date;
  }
  onSelectEndDateHandler(e: { date: Date }) {
    this.endDate = e.date;
  }


  private convertLocalDateToUTC(date: Date): string {
    const moment = momentNs.utc(date.getTime());
    return moment.format(this.detectorControlService.stringFormat);
  }

  //convert ISO string(UTC time) to LocalDate with same year,month,date...
  private convertUTCToLocalDate(date: Date): Date {
    const moment = momentNs.utc(date);
    return new Date(
      moment.year(), moment.month(), moment.date(),
      moment.hour(), moment.minute()
    );
  }

  //Get HH:mm from date
  private getHourAndMinute(date: Date): string {
    return moment(date).format('HH:mm');
  }

  private convertDateTimeToString(date: Date, time: string): string {
    const dateString = moment(date).format('YYYY-MM-DD');
    const hour = Number.parseInt(time.split(':')[0]) < 10 ? `0${Number.parseInt(time.split(':')[0])}` : `${Number.parseInt(time.split(':')[0])}`;
    const minute = Number.parseInt(time.split(':')[1]) < 10 ? `0${Number.parseInt(time.split(':')[1])}` : `${Number.parseInt(time.split(':')[1])}`;
    return `${dateString} ${hour}:${minute}`;
  }

  private checkParamIsSameAsMoment(param: string, moment: momentNs.Moment): boolean {
    const m = momentNs.utc(param);
    return m.isSame(moment);
  }


  //when click LastXX hours,prefill into custom input, should be UTC time
  selectCustom() {
    this.showTimePicker = true;
    this.timeDiffError = "";
    const currentDate = new Date();
    const end = new Date(currentDate.getTime() - 15 * 60 * 1000);
    const start = new Date(currentDate.getTime() - this.hourDiff * 60 * 60 * 1000);
    this.startDate = this.convertUTCToLocalDate(start);
    this.endDate = this.convertUTCToLocalDate(end);

    //startDate and endDate contains current hour and minute info
    //only need HH:mm
    this.startClock = this.getHourAndMinute(this.startDate);
    this.endClock = this.getHourAndMinute(this.endDate);
  }

  getErrorMessageOnTextField(value: string): string {
    var values = value.split(":");
    var errorMessage = "";
    if (!(values.length > 1 && +values[0] <= 24 && +values[1] <= 59)) {
      errorMessage = `Invalid time`;
    }
    return errorMessage;
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
}
