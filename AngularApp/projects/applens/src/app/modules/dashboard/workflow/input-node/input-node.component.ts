import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { inputType } from 'diagnostic-data';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'input-node',
  templateUrl: './input-node.component.html',
  styleUrls: ['./input-node.component.scss', '../node-styles.scss']
})
export class InputNodeComponent extends WorkflowNodeBaseClass implements OnInit {

  inputTypes: string[] = Object.values(inputType);
  dataSourceType: string = 'fixed';
  filteredOptions: Observable<string[]>;
  selectSourceInputControl = new FormControl('');
  uniqueId: string;
  inputType = inputType;

  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {

    this.uniqueId = Date.now().toString();
    this._workflowServicePrivate.variablesChangeEmitted$.subscribe(resp => {
      this.data.completionOptions = this._workflowServicePrivate.getVariableCompletionOptions(this).filter(x => x.type === 'Array');
      this.updateFilterOptions();
    });

    this.updateFilterOptions();
    if (this.data.inputNode.variableSelectSource) {
      this.selectSourceInputControl.setValue(this.data.inputNode.variableSelectSource);
    }

    if (this.data.inputNode && this.data.inputNode.variableSelectSource) {
      this.dataSourceType = 'dynamic';
    }
  }

  updateFilterOptions() {
    this.filteredOptions = this.selectSourceInputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.completionOptions.filter(x => x.type === 'Array')
      .filter(variable => variable.name.toLowerCase().includes(filterValue)).map(x => x.name);
  }

  updateVariable(value) {
    this.data.inputNode.variableSelectSource = value;
  }

  changeInputType(event: any) {
    this.data.inputNode.inputType = event.target.value;
  }

  changeDataSourceType(event: any) {
    if (event.target.value === 'dynamic' && this.data.completionOptions.length === 0) {
      this._workflowServicePrivate.showMessageBox("Error", "You cannot choose a dynamic data source as no variables of data type 'Array' exist in the workflow.");
      event.preventDefault();
      return;
    }

    this.dataSourceType = event.target.value;
    if (this.dataSourceType === 'fixed') {
      this.data.inputNode.variableSelectSource = '';
    } else {
      this.data.inputNode.options = '';
    }
  }

}
