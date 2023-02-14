import { Component, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import { HealthStatus } from '../../models/detector';
import { workflowNodeResult, workflowNodeState } from '../../models/workflow';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { WorkflowHelperService } from "../../services/workflow-helper.service";

@Component({
  selector: 'workflow-node',
  templateUrl: './workflow-node.component.html',
  styleUrls: ['./workflow-node.component.scss']
})
export class WorkflowNodeComponent extends NgFlowchartStepComponent<workflowNodeResult> implements OnInit {

  isLoading: boolean = false;
  error: any;
  status: HealthStatus = HealthStatus.Info;
  markdownHtml: string = '';
  runButtonClicked: boolean = false;

  constructor(private _diagnosticService: DiagnosticService, private _detectorControlService: DetectorControlService,
    private _workflowHelperService: WorkflowHelperService, private _markdownService: MarkdownService) {
    super();
  }

  ngOnInit(): void {
    this.updateStatus();
    if (this.data.promptType && this.data.promptType === 'automatic' && this.data.type !== "IfElseCondition" && this.data.type !== "SwitchCondition") {
      this.runNext(this.data.children);
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

    children.forEach(child => {
      if (this.data.isOnboardingMode != null && this.data.isOnboardingMode) {
        this.executeOnboardingNode(child);
      } else {
        this.executeNode(child)
      }
    });
  }

  executeOnboardingNode(child: workflowNodeState) {
    let body = {
      WorkflowPackage: this.data.workflowPublishBody,
      Resource: null
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
            this.addChild({
              template: WorkflowNodeComponent,
              type: 'workflowNode',
              data: workflowNodeResult
            }, {
              sibling: true
            }).then(addedNode => {
              this.addAdditionalNodesIfNeeded(workflowNodeResult, '', addedNode);
            });
          }
        }
      }, error => {
        this.error = error;
        this.isLoading = false;
      });
  }

  executeNode(child: workflowNodeState) {
    let startTime = this._detectorControlService.startTimeString;
    let endTime = this._detectorControlService.endTimeString;

    this._diagnosticService.getWorkflowNode(this.data.workflowId, this.data.workflowExecutionId, child.id, startTime, endTime,
      this._detectorControlService.isInternalView, null)
      .subscribe((nodeResult: workflowNodeResult) => {
        this.isLoading = false;
        if (nodeResult != null) {
          this._workflowHelperService.emitTraces(nodeResult);
        }

        if (nodeResult.type === "IfElseCondition" || nodeResult.type === "SwitchCondition") {
          this.addAdditionalNodesIfNeeded(nodeResult, nodeResult.description, this);
        } else {
          this.addChild({
            template: WorkflowNodeComponent,
            type: 'workflowNode',
            data: nodeResult
          }, {
            sibling: true
          }).then(addedNode => {
            this.addAdditionalNodesIfNeeded(nodeResult, '', addedNode);
          });

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
                  addedNode.addChild({
                    template: WorkflowNodeComponent,
                    type: 'workflowNode',
                    data: this.getDescriptionForConditionNodes(workflowNodeResult, description)
                  }, {
                    sibling: true
                  }).then(resp =>{
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
                  addedNode.addChild({
                    template: WorkflowNodeComponent,
                    type: 'workflowNode',
                    data: this.getDescriptionForConditionNodes(nodeResult, description)
                  }, {
                    sibling: true
                  }).then(resp =>{
                    this.isLoading = false;
                  });
                }, 500);
              });
          }
        }
      });
    }
  }

  showNextButton() {
    return this.data.promptType != 'automatic'
      && this.data.type.toLowerCase() != 'ifelsecondition'
      && this.data.type.toLowerCase() != 'switchcondition'
      && this.data.children
      && this.data.children.length > 0
  }

  getDescriptionForConditionNodes(nodeResult: workflowNodeResult, description: string): workflowNodeResult {
    if (nodeResult.type.toLowerCase() === 'iftrue'){
      nodeResult.description = `Because ${description} evaluated to true`;
    } else if (nodeResult.type.toLowerCase() === 'iffalse'){
      nodeResult.description = `Because ${description} evaluated to false`;
    } else if (nodeResult.type.toLowerCase() === 'switchcase'){
      nodeResult.description = `Because ${description} matched a configured node`;
    }  else if (nodeResult.type.toLowerCase() === 'switchcasedefault'){
      nodeResult.description = `Because ${description} matched no configured conditions`;
    }

      return nodeResult;
  }
}
