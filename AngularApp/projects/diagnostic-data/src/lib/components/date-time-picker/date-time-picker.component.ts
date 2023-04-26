import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as moment from 'moment';
import { IDatePickerProps, ITextFieldStyles } from 'office-ui-fabric-react';
import { TimeUtilities } from '../../utilities/time-utilities';

@Component({
  selector: 'date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss']
})
export class DateTimePickerComponent implements OnInit {
  @Input() label: string = "";
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showDatePickerOnly: boolean = false;

  @Input() set moment(m: moment.Moment) {
    if (m && m.isValid()) {
      this._moment = m.clone();
      this.updateDateAndTime(m);
    }
  }
  @Input() minMoment: moment.Moment;
  @Input() maxMoment: moment.Moment;
  @Output() momentChange: EventEmitter<moment.Moment> = new EventEmitter();
  @Output() onTabKeyPressInTime: EventEmitter<string> = new EventEmitter();
  @Output() onEnterPressInTime: EventEmitter<string> = new EventEmitter();

  date: Date;
  time: string = "00:00";
  minDate: Date;
  maxDate: Date;

  private isUTC: boolean = true;
  private _moment = moment.utc();

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    //only this format can do both fill in date and select date
    return TimeUtilities.formatDate(date);
  };

  parseDateFromString: IDatePickerProps['parseDateFromString'] = (s) => {
    return TimeUtilities.passDateFromString(s);
  }
  maskTextFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: "75px" } };

  ngOnInit(): void {
    this.isUTC = this.moment?.isUTC();
    if(this.showDatePickerOnly) this.time = "00:00";
    if (!this.minMoment || !this.minMoment.isValid()) {
      const defaultDuration = moment.duration(30, 'days');
      const minMoment = this.isUTC ? moment.utc().subtract(defaultDuration) : moment().subtract(defaultDuration);
      this.minMoment = minMoment.clone();
    }

    if (!this.maxMoment || !this.maxMoment.isValid()) {
      const maxMoment = this.isUTC ? moment.utc() : moment();
      this.maxMoment = maxMoment.clone();
    }

    this.minDate = TimeUtilities.convertMomentToDateAndTime(this.minMoment).date;
    this.maxDate = TimeUtilities.convertMomentToDateAndTime(this.maxMoment).date;

  }

  updateDateAndTime(m: moment.Moment) {
    const { date, time } = TimeUtilities.convertMomentToDateAndTime(m);
    this.date = date;
    this.time = time;
  }

  onSelectDateHandler(e: { date: Date }) {
    this.date = e.date;
    if (this.validateTimeInput(this.time)) {
      this._moment = TimeUtilities.convertDateAndTimeToMoment(this.date, this.time, this.isUTC);
      this.momentChange.next(this._moment.clone());
    }
  }

  onChangeClock(value: string) {
    this.time = value;
    if (this.validateTimeInput(value)) {
      this._moment = TimeUtilities.convertDateAndTimeToMoment(this.date, this.time, this.isUTC);
      this.momentChange.next(this._moment.clone());
    }
  }

  onTimeEnterHandler() {
    this.onEnterPressInTime.emit(this.time);
  }

  onTimeTabHandler() {
    this.onTabKeyPressInTime.emit(this.time);
  }

  private validateTimeInput(s: string): boolean {
    const regex = /\d{2}\:\d{2}$/;
    if(!s.match(regex)) return false;
    const hour = Number.parseInt(s.split(":")[0]);
    const minute = Number.parseInt(s.split(":")[1]);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return false;
    return hour <= 23 && minute <= 59
  }
}
