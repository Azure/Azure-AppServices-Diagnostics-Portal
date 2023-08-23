import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Moment } from 'moment';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import { HealthStatus } from '../../models/detector';
import { workflowNodeResult, workflowNodeState } from '../../models/workflow';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { WorkflowHelperService } from "../../services/workflow-helper.service";
import { WorkflowConditionNodeComponent } from '../workflow-condition-node/workflow-condition-node.component';
import Swal from 'sweetalert2';
import { WorkflowAcceptUserinputComponent } from '../workflow-accept-userinput/workflow-accept-userinput.component';

@Component({
  selector: 'workflow-node',
  templateUrl: './workflow-node.component.html',
  styleUrls: ['./workflow-node.component.scss']
})
export class WorkflowNodeComponent extends NgFlowchartStepComponent<workflowNodeResult> implements OnInit, AfterViewInit, OnDestroy {

  private acceptUserInput: WorkflowAcceptUserinputComponent;
  @ViewChild('acceptUserInput') set content(content: WorkflowAcceptUserinputComponent) {
    if (content) {
      this.acceptUserInput = content;
    }
  }

  @ViewChild('detectorViewDiv') detectorViewDiv: ElementRef;

  isLoading: boolean = false;
  error: any;
  status: HealthStatus = HealthStatus.Info;
  markdownHtml: string = '';
  runButtonClicked: boolean = false;
  endTime: Moment = this._detectorControlService.endTime;
  startTime: Moment = this._detectorControlService.startTime;
  resizeObserver: ResizeObserver;

  constructor(private _diagnosticService: DiagnosticService, private _detectorControlService: DetectorControlService,
    private _workflowHelperService: WorkflowHelperService) {
    super();
  }

  ngOnInit(): void {
    this.updateStatus();
    if (this.data.promptType && this.data.promptType === 'automatic' && this.data.type !== "IfElseCondition" && this.data.type !== "SwitchCondition") {
      this.runNext(this.data.children);
    }

    this.setupResizeObserver();
  }

  //
  // Force a re-render of the canvas when the height of the container changes.
  // This is specifically needed when a detector has elements (like insights)
  // that can change the height of the detector-view component. We have to
  // force a re-render of the canvas so that the nodes are re-positioned and
  // the connectors are re-drawn.
  //

  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      this.canvas.reRender();
    });
  }

  ngAfterViewInit(): void {

    //
    // Very critical to call this as the whole workflow falls apart
    //
    super.ngAfterViewInit();

    if (this.data.type !== "Detector" || this.data.detectorResponse == null) {
      return;
    }

    //
    // Setup the resize observer to observe for resizing of the
    //  parent div for detector-view component
    //

    if (this.detectorViewDiv != null && this.detectorViewDiv.nativeElement != null) {
      this.resizeObserver.observe(this.detectorViewDiv.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver != null) {
      this.resizeObserver.disconnect();
    }
  }

  updateStatus() {
    switch (this.data.status) {
      case "Info":
        this.status = HealthStatus.Info;
        break;
      case "Success":
        this.status = HealthStatus.Success;
        break;
      case "Warning":
        this.status = HealthStatus.Warning;
        break;
      case "None":
        this.status = HealthStatus.None;
        break;
      case "Critical":
        this.status = HealthStatus.Critical;
        break;
      default:
        break;
    }
  }

  runNext(children: workflowNodeState[]) {
    this.runButtonClicked = true;
    this.isLoading = true;

    if (this.data.type.toLowerCase() === "input") {
      let userInputs = this.acceptUserInput.getUserInput();
      let thisNode: workflowNodeState = { id: this.data.id, isActive: true };

      if (this.data.isOnboardingMode != null && this.data.isOnboardingMode) {
        this.executeOnboardingNode(thisNode, userInputs);
      } else {
        this.executeNode(thisNode, userInputs)
      }
    }
    else {
      children.forEach(child => {
        if (this.data.isOnboardingMode != null && this.data.isOnboardingMode) {
          this.executeOnboardingNode(child);
        } else {
          this.executeNode(child)
        }
      });
    }
  }

  executeOnboardingNode(child: workflowNodeState, userInputs: any = null) {
    let body = {
      WorkflowPackage: this.data.workflowPublishBody,
      Resource: null,
      UserInputs: userInputs
    }
    this._diagnosticService.getWorkflowCompilerResponse(body,
      this._detectorControlService.startTimeString,
      this._detectorControlService.endTimeString,
      {
        scriptETag: this.data.compilationProperties.scriptETag,
        assemblyName: this.data.compilationProperties.assemblyName,
        getFullResponse: true
      },
      this.data.workflowId,
      this.data.workflowExecutionId,
      child.id).subscribe((response: any) => {
        this.isLoading = false;
        let workflowNodeResult = this._workflowHelperService.getWorkflowNodeResultFromCompilationResponse(response, this.data.workflowPublishBody);
        if (workflowNodeResult != null) {
          this._workflowHelperService.emitTraces(workflowNodeResult);

          if (workflowNodeResult.type === "IfElseCondition" || workflowNodeResult.type === "SwitchCondition") {
            this.addAdditionalNodesIfNeeded(workflowNodeResult, workflowNodeResult.description, this);
          } else {

            if (userInputs == null) {
              this.addChild(this.getNewNode(workflowNodeResult, workflowNodeResult), {
                sibling: true
              }).then(addedNode => {
                this.addAdditionalNodesIfNeeded(workflowNodeResult, '', addedNode);
              });
            } else {
              if (workflowNodeResult.children && workflowNodeResult.children.length > 0) {
                this.isLoading = true;
                workflowNodeResult.children.forEach(child => {
                  this.executeOnboardingNode(child, null);
                });
              }
            }
          }
        }
      }, error => {
        this.error = error;
        this.isLoading = false;
      });
  }

  executeNode(child: workflowNodeState, userInputs: any = null) {
    let startTime = this._detectorControlService.startTimeString;
    let endTime = this._detectorControlService.endTimeString;

    this._diagnosticService.getWorkflowNode(this.data.workflowId, this.data.workflowExecutionId, child.id, startTime, endTime,
      this._detectorControlService.isInternalView, null, null, userInputs)
      .subscribe((nodeResult: workflowNodeResult) => {
        this.isLoading = false;
        if (nodeResult != null) {
          this._workflowHelperService.emitTraces(nodeResult);
        }

        if (nodeResult.type === "IfElseCondition" || nodeResult.type === "SwitchCondition") {
          this.addAdditionalNodesIfNeeded(nodeResult, nodeResult.description, this);
        } else {
          if (userInputs == null) {
            this.addChild(this.getNewNode(nodeResult, nodeResult), {
              sibling: true
            }).then(addedNode => {
              this.addAdditionalNodesIfNeeded(nodeResult, '', addedNode);
            });
          } else {
            if (nodeResult.children && nodeResult.children.length > 0) {
              this.isLoading = true;
              nodeResult.children.forEach(child => {
                this.executeNode(child, null);
              });
            }
          }

        }
      }, (error: any) => {
        this.isLoading = false;
        this.error = error.error ? error.error : error;
      });
  }

  addAdditionalNodesIfNeeded(nodeResult: workflowNodeResult, description: string, addedNode: NgFlowchartStepComponent<workflowNodeResult>) {
    if (nodeResult.type === "IfElseCondition" || nodeResult.type === "SwitchCondition") {
      let startTime = this._detectorControlService.startTimeString;
      let endTime = this._detectorControlService.endTimeString;
      this.isLoading = true;
      nodeResult.children.forEach(childNode => {
        if (childNode.isActive) {
          if (nodeResult.isOnboardingMode) {
            let body = {
              WorkflowPackage: this.data.workflowPublishBody,
              Resource: null
            }
            this._diagnosticService.getWorkflowCompilerResponse(body,
              startTime,
              endTime,
              {
                scriptETag: this.data.compilationProperties.scriptETag,
                assemblyName: this.data.compilationProperties.assemblyName,
                getFullResponse: true
              },
              this.data.workflowId,
              this.data.workflowExecutionId,
              childNode.id).subscribe((response: any) => {
                let workflowNodeResult = this._workflowHelperService.getWorkflowNodeResultFromCompilationResponse(response, this.data.workflowPublishBody);
                if (workflowNodeResult != null) {
                  this._workflowHelperService.emitTraces(workflowNodeResult);
                  addedNode.addChild(this.getNewNode(workflowNodeResult, this.getDescriptionForConditionNodes(workflowNodeResult, description)), {
                    sibling: true
                  }).then(resp => {
                    this.isLoading = false;
                  })
                }
              });
          } else {
            this._diagnosticService.getWorkflowNode(this.data.workflowId, this.data.workflowExecutionId, childNode.id, startTime, endTime,
              this._detectorControlService.isInternalView, null)
              .subscribe((nodeResult: workflowNodeResult) => {
                if (nodeResult != null) {
                  this._workflowHelperService.emitTraces(nodeResult);
                }
                setTimeout(() => {
                  addedNode.addChild(this.getNewNode(nodeResult, this.getDescriptionForConditionNodes(nodeResult, description)), {
                    sibling: true
                  }).then(resp => {
                    this.isLoading = false;
                  });
                }, 500);
              });
          }
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  showNextButton() {
    return this.data.promptType != 'automatic'
      && this.data.type.toLowerCase() != 'ifelsecondition'
      && this.data.type.toLowerCase() != 'switchcondition'
      && ((this.data.children && this.data.children.length > 0) || this.data.type.toLowerCase() === "input");
  }

  getDescriptionForConditionNodes(nodeResult: workflowNodeResult, description: string): workflowNodeResult {
    if (nodeResult.type.toLowerCase() === 'iftrue') {
      nodeResult.description = `Because ${description} evaluated to true`;
    } else if (nodeResult.type.toLowerCase() === 'iffalse') {
      nodeResult.description = `Because ${description} evaluated to false`;
    } else if (nodeResult.type.toLowerCase() === 'switchcase') {
      nodeResult.description = `Because ${description} matched a configured node`;
    } else if (nodeResult.type.toLowerCase() === 'switchcasedefault') {
      nodeResult.description = `Because ${description} matched no configured conditions`;
    }

    return nodeResult;
  }

  getNewNode(nodeResult: workflowNodeResult, data: any): NgFlowchart.PendingStep {
    let newNode: NgFlowchart.PendingStep = {} as NgFlowchart.PendingStep;
    newNode.data = data;
    if (nodeResult.type.toLowerCase() === 'iftrue' || nodeResult.type.toLowerCase() === 'iffalse' || nodeResult.type.toLowerCase() === 'switchcase' || nodeResult.type.toLowerCase() === 'switchcasedefault') {
      newNode.type = 'workflowConditionNode';
      newNode.template = WorkflowConditionNodeComponent;
      newNode.data = data;

    } else {
      newNode.type = 'workflowNode';
      newNode.template = WorkflowNodeComponent;
    }

    return newNode;
  }

  showMetadata() {
    let html: string = '';
    this.data.metadataPropertyBag.forEach(entry => {
      if (entry.key === 'Query') {
        html += "<div>"
        html += `<strong style='text-align:left;'>${entry.value.operationName}</strong>`;
        html += `<pre style='text-align:left;'>${entry.value.text}</pre>`;
        html += `<div><a href='${entry.value.url}' target='_blank'>Run in Kusto Web Explorer</a> <a class='ml-2' href='${entry.value.kustoDesktopUrl}' target='_blank'>Run in Kusto Desktop</a> </div>`
        html += "</div>"
      }
    });

    Swal.fire({
      title: 'Kusto',
      html: html,
      width: 1000,
      showCloseButton: true
    })
  }
}
