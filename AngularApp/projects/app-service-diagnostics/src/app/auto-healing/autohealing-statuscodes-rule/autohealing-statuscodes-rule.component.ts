import { Component } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { StatusCodeRules, StatusCodesBasedTrigger, StatusCodesRangeBasedTrigger } from '../../shared/models/autohealing';
import { FormatHelper } from '../../shared/utilities/formattingHelper';
import { IChoiceGroupOption } from 'office-ui-fabric-react/lib/components/ChoiceGroup';

@Component({
  selector: 'autohealing-statuscodes-rule',
  templateUrl: './autohealing-statuscodes-rule.component.html',
  styleUrls: ['../autohealing.component.scss']
})
export class AutohealingStatuscodesRuleComponent extends AutohealingRuleComponent {

  showRuleOptions: boolean = true;
  currentRangeRule: StatusCodesRangeBasedTrigger;
  currentStatusCodeRule: StatusCodesBasedTrigger;
  statusCodeIndex: number = -1;
  rangeIndex: number = -1;
  rangeRule: boolean = false;
  statusCodeRangeError: string = '';

  choiceGroupOptions: IChoiceGroupOption[] = [
    { key: 'singleStatusRule', text: 'Single HTTP Status', defaultChecked: true, onClick: () => { this.rangeRule = false; this.updateInMemoryRules(this.rangeRule); } },
    { key: 'rangeRule', text: 'HTTP Status Range', onClick: () => { this.rangeRule = true; this.updateInMemoryRules(this.rangeRule); } }
  ];

  constructor() {
    super();
  }

  addNewRule() {

    //
    // when someone is adding a new rule,
    // default to a StatusCodeRule
    //
    this.rangeRule = false;
    this.updateInMemoryRules(this.rangeRule);

    if (this.rule == null) {
      let statusCodesArray: StatusCodesBasedTrigger[] = [];
      let statusCodesRangeArray: StatusCodesRangeBasedTrigger[] = [];
      this.rule = new StatusCodeRules(statusCodesArray, statusCodesRangeArray);
    }
    this.editMode = true;
  }

  updateInMemoryRules(rangeRule: boolean) {
    if (rangeRule) {
      this.currentRangeRule = new StatusCodesRangeBasedTrigger();
      this.statusCodeIndex = -1;
    } else {
      this.currentStatusCodeRule = new StatusCodesBasedTrigger();
      this.rangeIndex = -1;
    }
  }

  deleteStatusCodeRule(i: number) {
    if (i > -1) {
      this.rule.statusCodes.splice(i, 1);
      this.ruleChange.emit(this.rule);
      this.displayRuleDeleted();
    }
  }

  editStatusCodeRule(i: number) {
    if (i > -1) {
      this.currentStatusCodeRule = { ...this.rule.statusCodes[i] };
      this.editMode = true;
      this.statusCodeIndex = i;
      this.showRuleOptions = false;
      this.rangeRule = false;
    }
  }

  deleteRangeRule(i: number) {
    if (i > -1) {
      this.rule.statusCodesRange.splice(i, 1);
      this.ruleChange.emit(this.rule);
      this.displayRuleDeleted();
    }
  }

  editRangeRule(i: number) {
    if (i > -1) {
      this.currentRangeRule = { ...this.rule.statusCodesRange[i] };
      this.editMode = true;
      this.rangeIndex = i;
      this.showRuleOptions = false;
      this.rangeRule = true;
    }
  }

  saveRule() {
    this.editMode = false;
    this.showRuleOptions = true;
    if (this.rangeRule) {
      if (this.rangeIndex < 0) {
        this.rule.statusCodesRange.push(this.currentRangeRule);
      } else {
        this.rule.statusCodesRange[this.rangeIndex] = this.currentRangeRule;
      }
    } else {
      if (this.currentStatusCodeRule.subStatus == null) {
        this.currentStatusCodeRule.subStatus = 0;
      }
      if (this.currentStatusCodeRule.win32Status == null) {
        this.currentStatusCodeRule.win32Status = 0;
      }

      if (this.statusCodeIndex < 0) {
        this.rule.statusCodes.push(this.currentStatusCodeRule);
      } else {
        this.rule.statusCodes[this.statusCodeIndex] = this.currentStatusCodeRule;
      }
    }

    this.ruleChange.emit(this.rule);
  }

  isValid(): boolean {
    if (this.rangeRule) {
      if (!this.isValidUrlPattern(this.currentRangeRule.path)) {
        return false;
      }
      return this.isValidStatusCodesRange(this.currentRangeRule.statusCodes) && this.currentRangeRule.count > 0 && FormatHelper.timespanToSeconds(this.currentRangeRule.timeInterval) > 0;
    } else {
      if (!this.isValidUrlPattern(this.currentStatusCodeRule.path)) {
        return false;
      }
      return this.currentStatusCodeRule.count > 0 && this.currentStatusCodeRule.status > 100
        && this.currentStatusCodeRule.status < 530
        && !(this.currentStatusCodeRule.status === 500 && this.currentStatusCodeRule.subStatus == 121)
        && (this.currentStatusCodeRule.timeInterval && this.currentStatusCodeRule.timeInterval && FormatHelper.timespanToSeconds(this.currentStatusCodeRule.timeInterval) > 0);
    }
  }

  getStatusCodeWithSubStatus(rule: StatusCodesBasedTrigger): string {
    if (rule.subStatus == 0 && rule.win32Status == 0) {
      return rule.status.toString();
    } else {
      if (rule.win32Status == 0) {
        return rule.status.toString() + "." + rule.subStatus.toString();
      } else {
        return rule.status.toString() + "." + rule.subStatus + "." + rule.win32Status.toString();
      }
    }
  }

  isValidStatusCodesRange(range: string): boolean {
    if (!range) {
      return false;
    }

    this.statusCodeRangeError = '';
    if (range.indexOf('.') > -1) {
      this.statusCodeRangeError = "HTTP Status code range cannot contain '.'";
      return false;
    }

    let rangeArray = range.split('-');
    if (rangeArray.length != 2) {
      this.statusCodeRangeError = "HTTP Status code range must contain one '-'";
      return false;
    }

    let start = Number(rangeArray[0]);
    let end = Number(rangeArray[1]);

    if (Number.isInteger(start) && Number.isInteger(end)) {
      if (start >= 100 && end >= 100 && start <= 530 && end <= 530) {

        if (start < end) {
          this.statusCodeRangeError = "";
          return true;
        } else {
          this.statusCodeRangeError = "HTTP Status start range cannot be lower than HTTP Status end range";
        }

      } else {
        this.statusCodeRangeError = "Valid HTTP Status codes range from HTTP 100 to HTTP 530 only";
      }
    } else {
      this.statusCodeRangeError = "HTTP Status code range specified is not a numberic value";
    }
    return false;
  }
}
