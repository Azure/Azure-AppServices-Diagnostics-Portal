import { Component, OnInit, Output, Input, EventEmitter, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IChoiceGroupOption } from 'office-ui-fabric-react';
import * as moment from 'moment';
import { DetectorControlService, TimePickerInfo, TimePickerOptions } from '../../services/detector-control.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { Observable } from 'rxjs';
import { UriUtilities } from '../../utilities/uri-utilities';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';


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
  selectedKey: string;
  get disableDateAndTimePicker() {
    return this.selectedKey !== TimePickerOptions.Custom;
  }

  startMoment: moment.Moment;
  endMoment: moment.Moment;
  minMoment: moment.Moment = moment.utc().subtract(30, 'days');
  maxMoment: moment.Moment = this.detectorControlService.currentUTCMoment;
  timeDiffError: string = "";

  isPublic: boolean = true;

  choiceGroupOptions: IChoiceGroupOption[] = [];



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
        this.startMoment = timerPickerInfo.startMoment.clone();
        this.endMoment = timerPickerInfo.endMoment.clone();
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
    this.startMoment = moment.utc().subtract(duration);
    this.endMoment = this.detectorControlService.currentUTCMoment;
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

    this.validateStartAndEndTime();

    const timePickerInfo: TimePickerInfo = {
      selectedKey: this.selectedKey,
      selectedText: this.selectedKey,
      startMoment: this.startMoment,
      endMoment: this.endMoment
    }


    if (this.timeDiffError === '') {
      this.detectorControlService.setCustomStartEndAfterValidation(this.startMoment, this.endMoment);
      this.detectorControlService.updateTimePickerInfo(timePickerInfo);
      this.updateTimerErrorMessage.emit("");
    }
    this.openTimePickerCallout = this.timeDiffError !== "";

    this.telemetryService.logEvent(TelemetryEventNames.TimePickerApplied, {
      'Title': timePickerInfo.selectedKey,
      'StartTime': this.startMoment.format(this.detectorControlService.stringFormat),
      'EndTime': this.endMoment.format(this.detectorControlService.stringFormat)
    });
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
  //In Applens, if endtime - starttime > 3 days or endtime <= starttime, endtime adjust to starttime + 1 day
  //In  D&S blade, endTime always adjust to starttime + 1 day
  onChangeStartMoment(startMoment: moment.Moment) {
    this.startMoment = startMoment.clone();
    const currentMoment = this.detectorControlService.currentUTCMoment.clone();
    const plusOneDayMoment = startMoment.clone().add(1, 'day');
    if (this.isPublic || this.endMoment.diff(startMoment, 'days') > 3 || this.endMoment.isSameOrBefore(startMoment)) {
      this.endMoment = moment.min(currentMoment, plusOneDayMoment);
    }
  }

  validateStartAndEndTime() {
    this.timeDiffError = this.detectorControlService.getMessageAndAutoAdjust(this.startMoment.format(this.detectorControlService.stringFormat), this.endMoment.format(this.detectorControlService.stringFormat)).errorMessage;
  }
}
