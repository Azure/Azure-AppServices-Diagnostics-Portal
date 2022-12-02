import { Component, OnInit } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { RequestsBasedTrigger } from '../../shared/models/autohealing';
import { FormatHelper } from '../../shared/utilities/formattingHelper';

@Component({
  selector: 'autohealing-requests-rule',
  templateUrl: './autohealing-requests-rule.component.html',
  styleUrls: ['../autohealing.component.scss']
})
export class AutohealingRequestsRuleComponent
  extends AutohealingRuleComponent
  implements OnInit
{
  constructor() {
    super();
  }

  addNewRule() {
    this.rule = new RequestsBasedTrigger();
    this.ruleCopy = new RequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    if (
      this.ruleCopy &&
      this.ruleCopy.timeInterval &&
      this.ruleCopy.timeInterval !== ''
    ) {
      return (
        FormatHelper.timespanToSeconds(this.ruleCopy.timeInterval) > 0 &&
        this.ruleCopy.count > 0
      );
    } else {
      return false;
    }
  }
}
