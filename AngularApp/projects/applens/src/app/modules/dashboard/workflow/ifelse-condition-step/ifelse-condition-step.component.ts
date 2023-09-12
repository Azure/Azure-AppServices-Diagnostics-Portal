import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import WorkflowNodeBaseClass from '../node-base-class';
import { map, startWith } from 'rxjs/operators';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'condition-step',
  templateUrl: './ifelse-condition-step.component.html',
  styleUrls: ['./ifelse-condition-step.component.scss', '../node-styles.scss']
})
export class IfElseConditionStepComponent extends WorkflowNodeBaseClass implements OnInit {

  dataType: string = 'string';
  leftControl = new FormControl('');
  rightControl = new FormControl('');
  numberDataTypes: string[] = ['Int32', 'Int64', 'Double', 'System.Int32', 'System.Int64', 'System.Double'];

  filteredOptionsLeft: Observable<string[]>;
  filteredOptionsRight: Observable<string[]>;
  uniqueId: string = '';

  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {
    this._workflowServicePrivate.variablesChangeEmitted$.subscribe(resp => {
      this.data.completionOptions = this._workflowServicePrivate.getVariableCompletionOptions(this);
      this.updateFilterOptions();
    });

    this.uniqueId = Date.now().toString();
    this.updateFilterOptions();

    if (this.data.ifconditionLeftValue) {
      this.leftControl.setValue(this.data.ifconditionLeftValue);
      this.updateDataTypeFromVariable(this.data.ifconditionLeftValue);
    }

    if (this.data.ifconditionRightValue) {
      this.rightControl.setValue(this.data.ifconditionRightValue);
      this.updateDataTypeFromVariable(this.data.ifconditionRightValue);
    }

  }

  updateFilterOptions() {
    this.filteredOptionsLeft = this.leftControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );

    this.filteredOptionsRight = this.rightControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.completionOptions.filter(variable => variable.name.toLowerCase().includes(filterValue)).map(x => x.name);
  }

  updateVariable(value, propertyName: string) {
    this.data[propertyName] = value;
    this.updateDataTypeFromVariable(value);
  }

  updateDataTypeFromVariable(value) {
    let idx = this.data.completionOptions.findIndex(x => x.name === value);
    if (idx > -1) {
      let dataType = this.data.completionOptions[idx].type;
      this.updateOptions(dataType);
    }
  }

  updateOptions(dataType: string) {
    if (this.numberDataTypes.findIndex(x => x === dataType) > -1) {
      this.dataType = 'number'
      if (!this.data.ifconditionExpression) {
        this.data.ifconditionExpression = 'lt';
      }

    }
    else if (dataType.toLowerCase() === "sbyte") {
      this.dataType = 'sbyte';
    }
    else if (dataType.toLowerCase().endsWith('boolean')) {
      this.dataType = 'boolean';
    }
    else {
      this.dataType = 'string';
      if (!this.data.ifconditionExpression) {
        this.data.ifconditionExpression = 'eq';
      }
    }
  }

}
