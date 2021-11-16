import { Component } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { SlowRequestsBasedTrigger, SlowRequestsRules } from '../../shared/models/autohealing';
import { FormatHelper } from '../../shared/utilities/formattingHelper';

@Component({
  selector: 'autohealing-slowrequests-rule',
  templateUrl: './autohealing-slowrequests-rule.component.html',
  styleUrls: ['../autohealing.component.scss']
})
export class AutohealingSlowrequestsRuleComponent extends AutohealingRuleComponent {

  currentRule: SlowRequestsBasedTrigger;
  slowRequestIndex: number = -1;
  editingSingleRule: boolean = false;

  constructor() {
    super();
  }

  showIntervalRecommendation: boolean = false;

  addNewRule() {
    this.currentRule = new SlowRequestsBasedTrigger();
    this.editMode = true;
    this.slowRequestIndex = -1;
    this.editingSingleRule = (this.rule == null || this.rule.slowRequests == null);
    if (this.rule == null) {
      let slowRequestsArray: SlowRequestsBasedTrigger[] = [];
      this.rule = new SlowRequestsRules(new SlowRequestsBasedTrigger(), slowRequestsArray)
    }
  }

  isValid(): boolean {
    if (this.currentRule && this.currentRule.timeInterval && this.currentRule.timeInterval !== '' && this.currentRule.timeTaken && this.currentRule.timeTaken != '') {
      let isValid: boolean = this.currentRule.count > 0 && FormatHelper.timespanToSeconds(this.currentRule.timeInterval) > 0 && FormatHelper.timespanToSeconds(this.currentRule.timeTaken) > 0 && this.isValidUrlPattern(this.currentRule.path);
      return isValid;
    } else {
      return false;
    }
  }

  deleteSingleRule() {
    this.rule.slowRequests = null;
    this.ruleChange.emit(this.rule);
    this.displayRuleDeleted();
  }

  editSingleRule() {
    this.currentRule = this.getClone(this.rule.slowRequests);
    this.editMode = true;
    this.editingSingleRule = true;
  }

  deleteSlowRequestRule(i: number) {
    if (i > -1) {
      this.rule.slowRequestsWithPath.splice(i, 1);
      this.ruleChange.emit(this.rule);
      this.displayRuleDeleted();
    }
  }

  editSlowRequestRule(i: number) {
    if (i > -1) {
      this.currentRule = { ...this.rule.slowRequestsWithPath[i] };
      this.editMode = true;
      this.slowRequestIndex = i;
      this.editingSingleRule = false;
    }
  }

  saveRule() {

    this.showIntervalRecommendation = this.currentRule.timeInterval < this.currentRule.timeTaken;
    if (this.showIntervalRecommendation) {
      return;
    }

    this.editMode = false;

    //
    // Azure App Service backend doesn't allow saving path at the
    // slowRequests node even though you see the path property in ARM
    // If the user is editing the rule for statusCodes only, make sure
    // he has not specified a path. If a path is specified, allow them
    // to update slowRequestsWithPath instead
    //
    if (this.editingSingleRule && !this.currentRule.path) {
      this.rule.slowRequests = this.getClone(this.currentRule);
    } else {

      //
      // This is the case where a user is trying to specify a path on 
      // an existing slowRequests rule. In this case, we need to clear the
      // slowRequests rule to ensure that a duplicate rule doesn't get added
      //
      if (this.editingSingleRule) {
        this.rule.slowRequests = null;
      }

      if (this.slowRequestIndex < 0) {
        this.rule.slowRequestsWithPath.push(this.currentRule);
      } else {
        this.rule.slowRequestsWithPath[this.slowRequestIndex] = this.currentRule;
      }
    }

    this.ruleChange.emit(this.rule);
  }
}
