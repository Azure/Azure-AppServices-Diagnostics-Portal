import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { workflowNode, stepVariable } from 'diagnostic-data';
import Swal from "sweetalert2";
import { WorkflowService } from '../services/workflow.service';

const regex: RegExp = /this\.rows\[(\d+)]\['(\w+)'\]/gm

@Component({
  selector: 'configure-variables',
  templateUrl: './configure-variables.component.html',
  styleUrls: ['./configure-variables.component.scss']
})
export class ConfigureVariablesComponent implements OnInit {

  @Input() variables: stepVariable[] = [];
  @Input() currentNode: any;
  @Output() onVariablesSaved = new EventEmitter<stepVariable[]>();

  currentVariable: stepVariable = new stepVariable();
  dataTypes: string[] = ['String', 'Int32', 'Int64', 'Double', 'DateTime'];
  isEditing: boolean = false;
  variableHasError: boolean = false;
  errorMessage = "Variable names should be of the format this.rows[0]['ColumnName']";
  editIndex = -1;
  constructor(private _workflowService: WorkflowService) {
  }

  ngOnInit(): void {
  }

  save() {
    let idx = this.variables.findIndex(x => x.name === this.currentVariable.name);
    if (idx === -1) {
      this.variables.push(this.currentVariable);
    } else {
      this.variables[idx] = this.currentVariable;
    }

    this.editIndex = -1;
    this.isEditing = false;
    this.onVariablesSaved.emit(this.variables);
  }

  addNew() {
    this.editIndex = -1;
    this.currentVariable = new stepVariable();
    this.currentVariable.name = 'CustomVariableForThisStep';
    this.currentVariable.value = 'this.rows[0][\'ColumnName\']';
    this.isEditing = true;
  }

  delete(idx: number) {
    let stepVariableName = this.variables[idx].name;
    if (this.isVariableInUse(stepVariableName)) {
      this._workflowService.showMessageBox("Error", "The variable " + stepVariableName + " is in use in the child nodes of the current node so it cannot be deleted");
      return;
    }

    this.variables.splice(idx, 1);
    this.onVariablesSaved.emit(this.variables);
  }

  edit(idx: number) {
    this.isEditing = true;
    this.editIndex = idx;
    this.currentVariable = this.variables[idx];
  }

  onVariableChange(event: any) {
    let updatedValue = event.target.value;
    regex.lastIndex = 0;
    this.variableHasError = !regex.test(updatedValue);
  }

  isVariableInUse(stepVariableName: string): boolean {
    return this._workflowService.isVariableInUse(stepVariableName, this.currentNode);
  }

  getKustoSampleUsage(variable: stepVariable): string {
    return this._workflowService.getKustoSampleUsage(variable);
  }

}
