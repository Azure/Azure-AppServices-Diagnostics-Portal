import { Component, Input, OnInit } from '@angular/core';
import { IDatePickerProps } from 'office-ui-fabric-react';
import { inputType, workflowNodeResult } from '../../models/workflow';
//import * as momentNs from 'moment';
import * as moment from 'moment';

@Component({
  selector: 'workflow-accept-userinput',
  templateUrl: './workflow-accept-userinput.component.html',
  styleUrls: ['./workflow-accept-userinput.component.scss']
})
export class WorkflowAcceptUserinputComponent implements OnInit {

  constructor() { }

  @Input() data: workflowNodeResult;

  inputType = inputType;
  inputFieldValue: string = '';
  selectFieldValue: string = '';

  dateFieldValue: Date = new Date();
  dateTimeField: string = '01:00';

  startDateFieldValue: Date = new Date();
  startTimeField: string = '01:00';

  endDateFieldValue: Date = new Date();
  endTimeField: string = '06:00';
  userInputDisabled: boolean = false;

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    return moment(date).format('YYYY-MM-DD');
  };

  ngOnInit(): void {
    if (this.data.inputNodeSettings && this.data.inputNodeSettings.inputType === inputType.select) {
      if (this.data.inputNodeSettings.options && this.data.inputNodeSettings.options.length > 0) {
        this.selectFieldValue = this.data.inputNodeSettings.options[0];
      } else if (this.data.inputNodeSettings.inputListItems && this.data.inputNodeSettings.inputListItems.length > 0) {
        this.selectFieldValue = this.data.inputNodeSettings.inputListItems[0].value;
      }
    }
  }

  getUserInput(): any {
    let userInputs = {};
    this.userInputDisabled = true;
    let keyName = Object.keys(this.data.inputNodeSettings.variables)[0];
    switch (this.data.inputNodeSettings.inputType) {
      case inputType.text:
        userInputs[keyName] = encodeURIComponent(this.inputFieldValue);
        break;
      case inputType.date:
        userInputs[keyName] = encodeURIComponent(this.getDateTime(this.dateFieldValue, this.dateTimeField));
        break;
      case inputType.select:
        userInputs[keyName] = encodeURIComponent(this.selectFieldValue);
        break;
      case inputType.daterange:
        let keyNameEndDate = Object.keys(this.data.inputNodeSettings.variables)[1];
        userInputs[keyName] = encodeURIComponent(this.getDateTime(this.startDateFieldValue, this.startTimeField));
        userInputs[keyNameEndDate] = encodeURIComponent(this.getDateTime(this.endDateFieldValue, this.endTimeField));
        break;

      default:
        break;
    }

    return userInputs;
  }

  selectChanged(event: any) {
    this.selectFieldValue = event.target.value;
  }

  onSelectDateHandler(event: any, kind: string) {
    if (event != null && event.date != null) {
      switch (kind) {
        case 'date':
          this.dateFieldValue = event.date;
          break;
        case 'startDate':
          this.startDateFieldValue = event.date;
          break;
        case 'endDate':
          this.endDateFieldValue = event.date;
          break;
        default:
          break;
      }

    }
  }

  getDateTime(date: Date, time: string): string {
    let timeValues = time.split(":");
    let dateTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(timeValues[0]), parseInt(timeValues[1]), 0, 0));
    return dateTime.toISOString();
  }

  getErrorMessageOnTextField(value: string): string {
    var values = value.split(":");
    var errorMessage = "";
    if (!(values.length > 1 && +values[0] <= 24 && +values[1] <= 59)) {
      errorMessage = `Invalid time`;
    }
    return errorMessage;
  }
}
