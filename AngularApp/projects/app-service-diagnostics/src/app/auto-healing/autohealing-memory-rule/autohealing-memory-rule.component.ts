import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { FormatHelper } from '../../shared/utilities/formattingHelper';

@Component({
  selector: 'autohealing-memory-rule',
  templateUrl: './autohealing-memory-rule.component.html',
  styleUrls: ['../autohealing.component.scss']
})
export class AutohealingMemoryRuleComponent extends AutohealingRuleComponent {

  constructor() {
    super();
  }

  addNewRule() {
    this.editMode = true;
  }

  ngOnInit(): void {
    if (this.rule) {
      this.ruleCopy = this.rule;
    }
  }

  saveRule() {
    this.rule = this.ruleCopy;
    this.editMode = false;
    this.ruleChange.emit(this.rule);
  }


  deleteRule() {
    this.displayDeleteRuleMessage = true;
    this.rule = 0;
    this.ruleCopy = 0;
    this.ruleChange.emit(this.rule);
    setTimeout(() => {
      this.displayDeleteRuleMessage = false;
    }, 5000);
  }

  isValid(): boolean {
    if (this.ruleCopy <= 102400 || this.ruleCopy > 32 * 1024 * 1024) {
      return false;
    } else {
      return true;
    }
  }

  formatBytes(bytes) {
    return FormatHelper.formatBytes(bytes, 2);
  }


}
