import { Component, OnInit } from '@angular/core';
import { DetectorMetaData, DetectorType, nodeType, workflow, workflowNode, workflowNodeData } from 'diagnostic-data';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'workflow-root-node',
  templateUrl: './workflow-root-node.component.html',
  styleUrls: ['./workflow-root-node.component.scss', '../node-styles.scss']
})
export class WorkflowRootNodeComponent extends NgFlowchartStepComponent<any> implements OnInit {

  nodeType = nodeType;
  workflowNodeDetectors: DetectorMetaData[] = [];
  showDetectorNode: boolean = false;

  constructor(private _workflowService: WorkflowService, private _applensDiagnosticService: ApplensDiagnosticService) {
    super();

    this._applensDiagnosticService.getDetectors().subscribe(detectors => {
      let workflowNodeDetectors = detectors.filter(x => x.type === DetectorType.WorkflowNode);
      this.showDetectorNode = workflowNodeDetectors.length > 0;
    });
  }

  ngOnInit(): void {
  }

  addNode(type: nodeType) {
    let wf = new workflow();
    let wfNode = new workflowNode();
    wfNode.data = new workflowNodeData();

    if (type === nodeType.detector) {
      wfNode.type = "detector";
      wfNode.data.name = "choosedetector";
      wfNode.data.detectorId = "choosedetector";
      wfNode.data.title = "Execute a detector";

    } else if (type === nodeType.kustoQuery) {
      wfNode.type = "kustoQuery";
      wfNode.data.name = "kustoQuery1";
      wfNode.data.title = this._workflowService.titleKustoNode;
    } else if (type === nodeType.markdown) {
      wfNode.type = "markdown";
      wfNode.data.name = "markdown1";
      wfNode.data.title = "Display Markdown";
    } else if (type === nodeType.input) {
      wfNode.type = "input";
      wfNode.data.name = "input1";
      wfNode.data.title = "Take User Input";
    }

    wfNode.children = [];
    wf.root = wfNode;
    let flow = new NgFlowchart.Flow(this.canvas);
    flow.upload(wf);
  }

}
