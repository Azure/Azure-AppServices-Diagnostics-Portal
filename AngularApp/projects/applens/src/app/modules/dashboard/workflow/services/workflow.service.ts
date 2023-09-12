import { Injectable } from "@angular/core";
import { nodeType, stepVariable, workflowNode, workflowNodeData, workflow, DetectorType, DetectorMetaData, inputType } from "diagnostic-data";
import { NgFlowchart, NgFlowchartStepComponent } from "projects/ng-flowchart/dist";
import { ConditionIffalseStepComponent } from "../condition-iffalse-step/condition-iffalse-step.component";
import { ConditionIftrueStepComponent } from "../condition-iftrue-step/condition-iftrue-step.component";
import { IfElseConditionStepComponent } from "../ifelse-condition-step/ifelse-condition-step.component";
import { DetectorNodeComponent } from "../detector-node/detector-node.component";
import { KustoNodeComponent } from "../kusto-node/kusto-node.component";
import { MarkdownNodeComponent } from "../markdown-node/markdown-node.component";
import { newNodeProperties } from "../node-actions/node-actions.component";
import { SwitchCaseDefaultStepComponent } from "../switch-case-default-step/switch-case-default-step.component";
import { SwitchCaseStepComponent } from "../switch-case-step/switch-case-step.component";
import { SwitchStepComponent } from "../switch-step/switch-step.component";
import { Subject } from "rxjs";
import Swal from 'sweetalert2';
import { ApplensDiagnosticService } from "../../services/applens-diagnostic.service";
import { ForeachNodeComponent } from "../foreach-node/foreach-node.component";
import { InputNodeComponent } from "../input-node/input-node.component";

const swalWithBootstrapButtons = Swal.mixin({
  customClass: {
    confirmButton: 'btn btn-danger',
    cancelButton: 'btn btn-danger',
  },
  buttonsStyling: false
});

@Injectable()
export class WorkflowService {
  isDisabled(node: NgFlowchartStepComponent<any>): boolean {
    return node.children.length > 0;
  }

  titleKustoNode: string = "Execute Kusto Query";
  nodeTypesAllowedForDragDrop: string[] = ['detector', 'kustoQuery', 'markdown'];
  nodeTypesAllowedForDrag: string[] = ['ifelsecondition', 'switchCondition'];
  nodeTypesAllowedForDropBelow: string[] = ['iffalse', 'iftrue', 'switchCaseDefault', 'switchCase'];

  //
  // Code to handle updation of variables on child nodes
  //

  private emitChangeVariables = new Subject<boolean>();
  variablesChangeEmitted$ = this.emitChangeVariables.asObservable();
  workflowNodeDetectors: DetectorMetaData[] = [];

  constructor(private _applensDiagnosticService: ApplensDiagnosticService) {
    this._applensDiagnosticService.getDetectors().subscribe(detectors => {
      this.workflowNodeDetectors = detectors.filter(x => x.type === DetectorType.WorkflowNode);
    });
  }

  emitVariablesChange(change: boolean) {
    this.emitChangeVariables.next(change);
  }

  isRootNode(node: NgFlowchartStepComponent<any>): boolean {
    if (node.parent) {
      return false;
    }
    return true;
  }

  onDelete(node: NgFlowchartStepComponent<any>) {
    let isParentNode = node.isRootElement();
    let canvas = node.canvas;
    node.destroy(true, true);

    if (isParentNode) {
      let flow = new NgFlowchart.Flow(canvas);
      this.addRootNode(flow);
    }
  }

  addRootNode(flow: NgFlowchart.Flow) {
    let wf = new workflow();
    let wfNode = new workflowNode();
    wfNode.data = new workflowNodeData();
    wfNode.data.name = "AddNode";
    wfNode.type = "rootNode";
    wfNode.data.title = "Add Root Node";
    wfNode.children = [];
    wf.root = wfNode;
    flow.upload(wf);
  }

  addChildNode(node: NgFlowchartStepComponent<any>, nodeType: nodeType) {
    let newNode: newNodeProperties = new newNodeProperties();
    newNode.isParallel = false;
    newNode.nodeType = nodeType;
    this.addNode(node, newNode);
  }

  addNode(node: NgFlowchartStepComponent<any>, newNode: newNodeProperties) {
    let currentNode = newNode.isParallel ? node.parent : node;
    switch (newNode.nodeType) {
      case nodeType.detector:
        let dataNodeDetector = this.getNewDetectorNode(currentNode, this.workflowNodeDetectors[0].id);
        currentNode.addChild({
          template: DetectorNodeComponent,
          type: 'detector',
          data: dataNodeDetector
        }, {
          sibling: true
        });
        break;

      case nodeType.kustoQuery:
        let dataNodeKustoQuery = this.getNewNode(currentNode, 'kustoQuery', this.titleKustoNode);
        currentNode.addChild({
          template: KustoNodeComponent,
          type: 'kustoQuery',
          data: dataNodeKustoQuery
        }, {
          sibling: true
        });
        break;

      case nodeType.markdown:
        let dataNodeMarkdown = this.getNewNode(currentNode, 'markdown', "Display Markdown");
        currentNode.addChild({
          template: MarkdownNodeComponent,
          type: 'markdown',
          data: dataNodeMarkdown
        }, {
          sibling: true
        });
        break;

      case nodeType.input:
        let dataNodeInput = this.getNewNode(currentNode, 'input', "Take User input");
        currentNode.addChild({
          template: InputNodeComponent,
          type: 'input',
          data: dataNodeInput
        }, {
          sibling: true
        });
        break;

      default:
        break;
    }
  }

  getNewDetectorNode(node: NgFlowchartStepComponent<any>, detectorId: string): workflowNodeData {
    let wfNodeData = new workflowNodeData();
    wfNodeData.name = "choosedetector";
    wfNodeData.detectorId = "choosedetector";
    wfNodeData.title = "Execute a detector";
    wfNodeData.completionOptions = this.getVariableCompletionOptions(node);
    return wfNodeData;
  }

  getNewNode(node: NgFlowchartStepComponent<any>, nodeId: string, title: string): workflowNodeData {
    let idNumber = this.getIdNumberForNode(node, nodeId);
    let wfNodeData = new workflowNodeData();
    wfNodeData.name = nodeId + idNumber;
    wfNodeData.title = title;
    wfNodeData.completionOptions = this.getVariableCompletionOptions(node);
    return wfNodeData;
  }

  getIdNumberForNode(node: NgFlowchartStepComponent<any>, nodeId: string): number {
    let parentNode = node;
    while (parentNode.parent != null) {
      parentNode = parentNode.parent;
    }

    return this.getMaxIdForNode(nodeId, parentNode, 0) + 1;
  }

  getMaxIdForNode(nodeId: string, node: NgFlowchartStepComponent, num: number): number {
    if (this.isActionNode(node)) {
      let nodeName: string = node.data.name;
      if (nodeName.startsWith(nodeId)) {
        let intPart = nodeName.substring(nodeId.length);
        if (this.is_int(intPart)) {
          let newNum = parseInt(intPart);
          num = Math.max(num, newNum);
        }
      }
    }

    if (node.hasChildren) {
      for (var node of node.children) {
        num = Math.max(num, this.getMaxIdForNode(nodeId, node, num));
      }
      return num;
    } else {
      return num;
    }
  }

  is_int(value) {
    if ((parseInt(value) % 1 === 0)) {
      return true;
    } else {
      return false;
    }
  }

  addCondition(node: NgFlowchartStepComponent<any>) {
    let wfNode = new workflowNode();
    let wfIfTrueNode = new workflowNode();
    let wfIfFalseNode = new workflowNode();

    wfIfTrueNode.type = "iftrue";
    wfIfFalseNode.type = "iffalse";

    wfNode.children = [];
    wfNode.children.push(wfIfTrueNode);
    wfNode.children.push(wfIfFalseNode);

    let dataNode = new workflowNodeData();
    dataNode.name = "some-condition";
    dataNode.title = "If-Else Condition";

    let ifTrueDataNode = new workflowNodeData();
    ifTrueDataNode.name = "iftrue";
    ifTrueDataNode.title = "If Condition Result";
    ifTrueDataNode.description = "Condition evaluated to true";

    let ifFalseDataNode = new workflowNodeData();
    ifFalseDataNode.name = "iffalse";
    ifFalseDataNode.title = "If Condition Result";
    ifFalseDataNode.description = "Condition evaluated to false";

    dataNode.completionOptions = this.getVariableCompletionOptions(node);

    let condtionNode = node.addChild({
      template: IfElseConditionStepComponent,
      type: 'ifelsecondition',
      data: dataNode
    }, {
      sibling: true
    });

    condtionNode.then((addedNode) => {
      addedNode.addChild({
        template: ConditionIftrueStepComponent,
        type: 'iftrue',
        data: ifTrueDataNode
      }, {
        sibling: true
      });

      //
      // Do this with a small delay so the nodes get
      // unique Id's else they are getting generated
      // with the same Id
      //

      setTimeout(() => {
        addedNode.addChild({
          template: ConditionIffalseStepComponent,
          type: 'iffalse',
          data: ifFalseDataNode
        }, {
          sibling: true
        });
      }, 500);
    });

  }

  addSwitchCondition(node: NgFlowchartStepComponent<any>) {
    let wfNode = new workflowNode();
    let swithCaseNode = new workflowNode();
    let switchCaseDefaultNode = new workflowNode();
    swithCaseNode.type = "switchCaseMain";
    switchCaseDefaultNode.type = "switchCaseDefault";

    wfNode.children = [];
    wfNode.children.push(swithCaseNode, switchCaseDefaultNode);

    let dataNode = new workflowNodeData();

    let switchCaseDataNode = new workflowNodeData();
    switchCaseDataNode.name = "switchCase";
    switchCaseDataNode.title = "Case Equals";

    let switchCaseDefaultDataNode = new workflowNodeData();
    switchCaseDefaultDataNode.name = "switchCaseDefault";
    switchCaseDefaultDataNode.title = "Default";

    let completionOptions = this.getVariableCompletionOptions(node);
    dataNode.name = "switch-condition";
    dataNode.title = "Switch";
    dataNode.completionOptions = completionOptions;
    switchCaseDataNode.completionOptions = completionOptions;;

    let condtionNode = node.addChild({
      template: SwitchStepComponent,
      type: 'switchCondition',
      data: dataNode
    }, {
      sibling: true
    });

    condtionNode.then((addedNode) => {
      addedNode.addChild({
        template: SwitchCaseStepComponent,
        type: 'switchCase',
        data: switchCaseDataNode
      }, {
        sibling: true
      });

      //
      // Do this with 1 second delay so the nodes get
      // unique Id's else they are getting generated
      // with the same Id
      //

      setTimeout(() => {
        addedNode.addChild({
          template: SwitchCaseDefaultStepComponent,
          type: 'switchCaseDefault',
          data: switchCaseDefaultDataNode
        }, {
          sibling: true
        });
      }, 500);
    });

  }

  addSwitchCase(node: NgFlowchartStepComponent<any>) {
    let swithCaseNode = new workflowNode();
    swithCaseNode.type = "switchCase";
    let switchCondtionNode = node.parent;

    let switchCaseDataNode = new workflowNodeData();
    switchCaseDataNode.name = "switchCase";
    switchCaseDataNode.title = "Case";
    switchCaseDataNode.completionOptions = this.getVariableCompletionOptions(node);

    let switchCaseIndex = switchCondtionNode.children.length - 2;
    switchCondtionNode.addChild({
      template: SwitchCaseStepComponent,
      type: 'switchCase',
      data: switchCaseDataNode
    }, {
      sibling: true,
      index: switchCaseIndex
    });
  }

  addForEach(node: NgFlowchartStepComponent<any>) {
    let currentNode = node;
    let foreachNode = new workflowNode();
    foreachNode.type = "foreach";

    let foreachDataNode = new workflowNodeData();
    foreachDataNode.name = "foreach";
    foreachDataNode.title = "For Each";
    foreachDataNode.completionOptions = this.getVariableCompletionOptions(node).filter(x => x.type === 'Array');

    currentNode.addChild({
      template: ForeachNodeComponent,
      type: 'foreach',
      data: foreachDataNode
    }, {
      sibling: true
    });
  }

  isActionNode(node: NgFlowchartStepComponent<any>): boolean {
    if (node.type === 'detector'
      || node.type === 'markdown'
      || node.type === 'kustoQuery'
      || node.type === 'input') {
      return true;
    }

    return false;
  }

  isConditionNode(node:NgFlowchartStepComponent<workflowNodeData>){
    if (node.type === 'ifelsecondition'
      || node.type === 'switchCondition') {
      return true;
    }

    return false;
  }

  getVariableCompletionOptions(node: NgFlowchartStepComponent<workflowNodeData>, includeCurrentNode: boolean = true): stepVariable[] {
    let allVariables: stepVariable[] = [];
    let currentNode = node;
    while (currentNode != null) {
      if (includeCurrentNode) {
        if (this.isActionNode(currentNode)) {
          allVariables = allVariables.concat(currentNode.data.variables);
          if (currentNode.type === 'input') {
            if (currentNode.data.inputNode.inputType === inputType.daterange) {
              allVariables.push(this.getStepVariableForInputNode(currentNode.data.name, currentNode.data.inputNode.startDateVariableName));
              allVariables.push(this.getStepVariableForInputNode(currentNode.data.name, currentNode.data.inputNode.endDateVariableName));

            } else {
              allVariables.push(this.getStepVariableForInputNode(currentNode.data.name, currentNode.data.inputNode.variableName));
            }
          }
        }
      }
      includeCurrentNode = true;
      currentNode = currentNode.parent;
    }
    return allVariables;
  }

  getStepVariableForInputNode(nodeName: string, variableName: string): stepVariable {
    let inputVariable: stepVariable = new stepVariable();
    inputVariable.type = 'System.String';
    inputVariable.name = nodeName + '_' + variableName;
    inputVariable.value = nodeName + '_' + variableName;
    inputVariable.runtimeValue = "UserInput";
    inputVariable.isUserInput = true;
    return inputVariable;
  }

  isUniqueNodeName(name: string, currentNode: NgFlowchartStepComponent<workflowNodeData>): boolean {
    let existingNode = this.findNodeByName(name, currentNode.canvas.flow.rootStep);
    if (existingNode == null) {
      return true;
    }

    return existingNode.id === currentNode.id;
  }

  findNodeByName(name: string, currentNode: NgFlowchartStepComponent<workflowNodeData>): workflowNode {
    if (currentNode.data.name.toLowerCase() === name.toLowerCase()) {
      return currentNode;
    }

    for (let index = 0; index < currentNode.children.length; index++) {
      const child = this.findNodeByName(name, currentNode.children[index]);
      if (child != null && child.data.name.toLowerCase() === name.toLowerCase()) {
        return child;
      }
    }

    return null;
  }

  isVariableInUse(stepVariableName: string, node: NgFlowchartStepComponent<workflowNodeData>): boolean {

    for (let index = 0; index < node.children.length; index++) {
      const child = node.children[index];
      if (child != null && this.isNodeUsingVariable(stepVariableName, child)) {
        return true;
      }

      return this.isVariableInUse(stepVariableName, child);
    }

    return false;
  }

  getQueryText(data: workflowNodeData): string {
    if (data.queryText) {
      return data.queryText;
    }

    if (data.kustoNode && data.kustoNode.queryText) {
      return data.kustoNode.queryText
    }

    return '';
  }

  isNodeUsingVariable(stepVariableName: string, node: NgFlowchartStepComponent<workflowNodeData>): boolean {
    if (node.data.markdownText.toLowerCase().indexOf(stepVariableName.toLocaleLowerCase()) > -1) {
      return true;
    }
    if (node.data.status.toLowerCase().indexOf(stepVariableName.toLocaleLowerCase()) > -1) {
      return true;
    }

    if (node.type === 'kustoQuery' && this.getQueryText(node.data)) {
      let queryPlainText = this.decodeBase64String(this.getQueryText(node.data));
      if (queryPlainText.indexOf(stepVariableName.toLocaleLowerCase()) > -1) {
        return true;
      }
    }
    else if (node.type === 'ifelsecondition') {
      if (node.data.ifconditionLeftValue.toLowerCase().indexOf(stepVariableName.toLocaleLowerCase()) > -1) {
        return true;
      }

      if (node.data.ifconditionRightValue.toLowerCase().indexOf(stepVariableName.toLocaleLowerCase()) > -1) {
        return true;
      }
    }
    else if (node.type === 'switchCondition') {
      if (node.data.switchOnValue.toLowerCase().indexOf(stepVariableName.toLocaleLowerCase()) > -1) {
        return true;
      }
    }

    return false;
  }

  decodeBase64String(input: string): string {
    return atob(input);
  }

  showMessageBox(title: string, message: string, showError: boolean = true) {
    swalWithBootstrapButtons.fire(title, message, showError ? 'error' : 'success');
  }

  showMessageBoxWithFooter(title: string, message: string, footer: string, width?: string) {
    swalWithBootstrapButtons.fire({
      icon: 'error',
      title: title,
      html: message,
      footer: footer,
      width: width
    });
  }

  isValidVariableName(variableName: string): boolean {
    const regexVarName = new RegExp('^[a-zA-Z_][a-zA-Z_0-9]*$');
    return regexVarName.test(variableName);
  }

  getKustoSampleUsage(variable: stepVariable): string {
    let variableType = variable.type;
    if (variableType.startsWith('System.')) {
      variableType = variableType.substring(6);
    }

    if (variableType == 'String') {
      return `| where StringTypeColumn =~ '{${variable.name}}'`;
    } else if (variableType == 'DateTime') {
      return `| where DateTypeColumn > datetime({${variable.name}})`;
    } else if (variableType == 'Array') {
      return `| where SomeColumnName in {NormalizeArray(${variable.name}, addQuotes:true)}`;
    }

    return `| where NumberTypeColumn == {${variable.name}}`;
  }

  getStatusUsage(variable: stepVariable): string {
    let variableType = variable.type;
    if (variableType.startsWith('System.')) {
      variableType = variableType.substring(6);
    }

    if (variableType == 'String') {
      return `${variable.name}.StartsWith("SomeValue") ? \"Critical\" : \"Success\"`;
    } else if (variableType == 'DateTime') {
      return `${variable.name} > DateTime.MinValue ? \"Critical\" : \"Success\"`;
    }

    return `${variable.name} > 100 ? \"Critical\" : \"Success\"`;
  }

  refreshVariables(workflowNode: NgFlowchartStepComponent<workflowNodeData>) {
    if (this.isActionNode(workflowNode) || this.isConditionNode(workflowNode)) {
      workflowNode.data.completionOptions = this.getVariableCompletionOptions(workflowNode, false);
    }

    for (let index = 0; index < workflowNode.children.length; index++) {
      const child = workflowNode.children[index];
      if (child != null) {
        this.refreshVariables(child);
      }
    }
  }
}