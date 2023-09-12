import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'switch-step',
  templateUrl: './switch-step.component.html',
  styleUrls: ['./switch-step.component.scss', '../node-styles.scss']
})
export class SwitchStepComponent extends WorkflowNodeBaseClass implements OnInit {

  dataType: string;
  filteredOptions: Observable<string[]>;
  switchInputControl = new FormControl('');
  uniqueId:string;
  
  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {

    this.uniqueId = Date.now().toString();
    this._workflowServicePrivate.variablesChangeEmitted$.subscribe(resp => {
      this.data.completionOptions = this._workflowServicePrivate.getVariableCompletionOptions(this);
      this.updateFilterOptions();
    });

    this.updateFilterOptions();
    if (this.data.switchOnValue) {
      this.switchInputControl.setValue(this.data.switchOnValue);
    }
  }

  updateFilterOptions() {
    this.filteredOptions = this.switchInputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.completionOptions.filter(variable => variable.name.toLowerCase().includes(filterValue)).map(x => x.name);
  }

  updateVariable(value) {
    this.data.switchOnValue = value;
    let idx = this.data.completionOptions.findIndex(x => x.name === value);
    if (idx > -1) {
      this.dataType = this.data.completionOptions[idx].type;
    }
  }

}
