import { Input, Output, EventEmitter, OnInit, Directive } from '@angular/core';

@Directive()
export abstract class AutohealingRuleComponent implements OnInit {

  ruleCopy: any;
  displayDeleteRuleMessage: boolean = false;

  @Input() rule: any;
  @Output() ruleChange = new EventEmitter<any>();
  editMode: boolean = false;

  ngOnInit(): void {
    if (this.rule) {
      this.ruleCopy = this.getClone(this.rule);
    }
  }

  editRule() {
    this.editMode = true;
  }

  deleteRule() {
    this.rule = null;
    this.ruleCopy = null;
    this.ruleChange.emit(this.rule);
    this.displayRuleDeleted();
  }

  displayRuleDeleted() {
    this.displayDeleteRuleMessage = true;
    setTimeout(() => {
      this.displayDeleteRuleMessage = false;
    }, 5000);
  }

  saveRule() {
    this.rule = this.getClone(this.ruleCopy);
    this.editMode = false;
    this.ruleChange.emit(this.rule);
  }

  getClone(obj: any) {
    return (JSON.parse(JSON.stringify(obj)));
  }

  isValidUrlPattern(pattern: string): boolean {
    if (!pattern) {
      return true;
    }

    //
    // Path should only allow 1-9, A-Z, period, forward slash, underscore, asterisk 
    // '?' symbol is not allowed as the backend supports '*' wildcard only
    // prohibiting '?' also ensures that no one can specify query strings
    //
    const regEx = new RegExp(/^[\*/\w-_.]*$/);
    return regEx.test(pattern);
  }

}
