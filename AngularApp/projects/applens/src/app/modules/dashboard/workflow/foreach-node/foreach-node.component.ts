import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'foreach-node',
  templateUrl: './foreach-node.component.html',
  styleUrls: ['./foreach-node.component.scss', '../node-styles.scss']
})
export class ForeachNodeComponent extends WorkflowNodeBaseClass implements OnInit {

  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);
  }

  dataType: string;
  filteredOptions: Observable<string[]>;
  foreachInputControl = new FormControl('');
  uniqueId: string;

  ngOnInit(): void {

    this.uniqueId = Date.now().toString();
    this._workflowServicePrivate.variablesChangeEmitted$.subscribe(resp => {
      this.data.completionOptions = this._workflowServicePrivate.getVariableCompletionOptions(this).filter(x => x.type === 'Array');
      this.updateFilterOptions();
    });

    this.updateFilterOptions();
    if (this.data.foreachVariable) {
      this.foreachInputControl.setValue(this.data.foreachVariable);
    }
  }

  updateFilterOptions() {
    this.filteredOptions = this.foreachInputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.data.completionOptions.filter(variable => variable.name.toLowerCase().includes(filterValue)).map(x => x.name);
  }

  updateVariable(value) {
    this.data.foreachVariable = value;
    let idx = this.data.completionOptions.findIndex(x => x.name === value);
    if (idx > -1) {
      this.dataType = this.data.completionOptions[idx].type;
    }
  }
}
