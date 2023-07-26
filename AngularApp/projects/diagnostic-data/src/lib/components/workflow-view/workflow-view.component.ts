import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { QueryResponse } from '../../models/compiler-response';
import { workflowExecution, workflowNodeExecution, workflowNodeResult, workflowNodeState, workflowPublishBody } from '../../models/workflow';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { WorkflowHelperService } from "../../services/workflow-helper.service";
import { WorkflowConditionNodeComponent } from '../workflow-condition-node/workflow-condition-node.component';
import { WorkflowNodeComponent } from '../workflow-node/workflow-node.component';
import { BehaviorSubject } from 'rxjs';
import { IButtonStyles, IIconProps } from 'office-ui-fabric-react';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';

@Component({
  selector: 'workflow-view',
  templateUrl: './workflow-view.component.html',
  styleUrls: ['./workflow-view.component.scss']
})
export class WorkflowViewComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() workflowId: string;
  @Input() workflowNodeResult: workflowNodeResult;
  @Input() onboardingFlow: boolean = false;
  @Input() workflowPublishBody: workflowPublishBody;
  @Input() lastRefreshed: string;
  @Output() onError = new EventEmitter<any>();
  @Output() onPackageUpdated = new EventEmitter<any>();

  error: any;
  workflowNodeResults: workflowNodeResult[] = [];
  workflowExecutionId: string = '';
  isLoading: boolean = false;
  workflowExecution: workflowExecution = null;
  disabled: boolean = true;
  compilationTraces: string[] = [];
  compilationSucceeded: boolean = false;
  nodeResults: workflowNodeResult[] = [];
  timePickerErrorStr: string = '';
  timePickerButtonStr: string = '';
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  supportDocumentContent: string = "";
  supportDocumentRendered: boolean = false;
  firstNodeLoaded: boolean = false;
  inCaseSubmission:boolean = false;

  buttonStyle: IButtonStyles = {
    root: {
      // color: "#323130",
      borderRadius: "12px",
      margin: " 0px 5px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "13",
      fontWeight: "600",
      height: "80%"
    },
    rootFocused: {
      border: "2px solid black",
    }
  }
  iconStyles: IIconProps["styles"] = {
    root: {
      color: "#0078d4"
    }
  }

  options: NgFlowchart.Options = {
    stepGap: 40,
    rootPosition: 'TOP_CENTER',
    zoom: {
      mode: 'DISABLED'
    }
  };

  get loadingMessage() {
    return `Analyzing data ${this.timePickerButtonStr.includes("to") ? "from" : "in"} ${this.timePickerButtonStr}, to change, use the time range picker`;
  }

  @ViewChild(NgFlowchartCanvasDirective)
  canvas: NgFlowchartCanvasDirective;

  constructor(private _route: ActivatedRoute, private _detectorControlService: DetectorControlService,
    private _diagnosticService: DiagnosticService, private stepRegistry: NgFlowchartStepRegistry,
    private _workWorkflowService: WorkflowHelperService, private detectorControlService: DetectorControlService,
    private _supportTopicService: GenericSupportTopicService) {
  }

  ngOnInit(): void {
    this._workWorkflowService.changeEmitted$.subscribe(resp => {
      if (resp) {
        this.nodeResults.unshift(resp);
      }
    });
  }

  ngAfterViewInit() {
    this.stepRegistry.registerStep('workflowNode', WorkflowNodeComponent);
    this.stepRegistry.registerStep('workflowConditionNode', WorkflowConditionNodeComponent);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.reset();
    this.initialize();
  }

  reset() {
    this.workflowExecutionId = '';
    this.workflowExecution = null;
    if (this.canvas) {
      this.canvas.getFlow().clear();
    }
  }

  initialize() {
    if (this.onboardingFlow) {
      this.emitError(null);
      this.isLoading = true;
      let body = {
        WorkflowPackage: this.workflowPublishBody,
        Resource: null
      }

      this._diagnosticService.getWorkflowCompilerResponse(body, this._detectorControlService.startTimeString,
        this._detectorControlService.endTimeString, {
        scriptETag: '',
        assemblyName: '',
        getFullResponse: true
      }, this.workflowId).subscribe((response: any) => {
        let workflowQueryResponse: QueryResponse<workflowNodeResult> = response.body;
        this.isLoading = false;
        this.compilationSucceeded = workflowQueryResponse.compilationOutput.compilationSucceeded;
        if (this.compilationSucceeded) {
          let workflowNodeResult = this._workWorkflowService.getWorkflowNodeResultFromCompilationResponse(response, this.workflowPublishBody);
          if (workflowNodeResult != null) {
            this.createRootNode(workflowNodeResult);
          }

          this.onPackageUpdated.emit(workflowQueryResponse.invocationOutput.workflowPackage);

        } else {
          if (workflowQueryResponse.compilationOutput.compilationTraces != null && workflowQueryResponse.compilationOutput.compilationTraces.length > 0) {
            this.emitError(workflowQueryResponse.compilationOutput.compilationTraces.toString());
          }
        }
      }, (error: any) => {
        this.emitError(error);
      });

    } else {
      this.run(null);
    }

    this.detectorControlService.timePickerStrSub.subscribe(s => {
      this.timePickerButtonStr = s;
    });
  }

  run(childNode: workflowNodeState) {
    this.emitError(null);
    this.isLoading = true;
    let startTime = this._detectorControlService.startTimeString;
    let endTime = this._detectorControlService.endTimeString;
    let childNodeId: string = '';
    if (childNode != null) {
      childNodeId = childNode.id;
    }

    this._diagnosticService.getWorkflowNode(this.workflowId, this.workflowExecutionId, childNodeId, startTime, endTime,
      this._detectorControlService.isInternalView, null)
      .subscribe((response: workflowNodeResult) => {
        this.isLoading = false;
        this.workflowNodeResults = this.workflowNodeResults.concat(response);
        this.workflowExecutionId = response.workflowExecutionId;
        if (this.workflowExecution == null) {
          this.createRootNode(response);
        }

        if (!this.firstNodeLoaded) {
          this.firstNodeLoaded = true;
          if (this.isInCaseSubmission()) {
            this.inCaseSubmission = true;
            this.populateSupportTopicDocument();
          }
        }

      }, (error: any) => {
        this.emitError(error);
      });
  }

  createRootNode(result: workflowNodeResult) {
    this.workflowExecution = new workflowExecution();
    let wfNode = new workflowNodeExecution();
    wfNode.data = result;
    wfNode.type = "workflowNode";
    wfNode.children = [];
    this.workflowExecution.root = wfNode;
    this.canvas.getFlow().upload(this.workflowExecution);
    this.nodeResults.push(result);
  }

  emitError(error: any) {
    if (error != null && error.error) {
      error = error.error;
    }

    this.isLoading = false;
    this.error = error;

    if (error != null) {
      this.onError.emit(error);
    }
  }

  updateTimePickerErrorMessage(message: string) {
    this.timePickerErrorStr = message;
  }

  populateSupportTopicDocument() {
    if (!this.supportDocumentRendered) {
      this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
        if (res && res.length > 0) {
          this.supportDocumentContent = res;
          this.supportDocumentRendered = true;
        }
      });
    }
  }

  isInCaseSubmission(): boolean {
    return !!this._supportTopicService && !!this._supportTopicService.supportTopicId && this._supportTopicService.supportTopicId != '';
  }
}
