import { Component, OnInit } from '@angular/core';
import { nodeType, workflow, workflowNode, workflowNodeData } from 'diagnostic-data';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'workflow-root-node',
  templateUrl: './workflow-root-node.component.html',
  styleUrls: ['./workflow-root-node.component.scss', '../node-styles.scss']
})
export class WorkflowRootNodeComponent extends NgFlowchartStepComponent<any> implements OnInit {

  nodeType = nodeType;

  constructor(private _workflowService: WorkflowService) {
    super();
  }

  ngOnInit(): void {
  }

  addNode(type: nodeType) {
    let wf = new workflow();
    let wfNode = new workflowNode();
    wfNode.data = new workflowNodeData();

    if (type === nodeType.detector) {
      wfNode.type = "detector";
      wfNode.data.name = this._workflowService.newDetectorId + "1";
      wfNode.data.detectorId = this._workflowService.newDetectorId;
      wfNode.data.title = "Execute a detector";

    } else if (type === nodeType.kustoQuery) {
      wfNode.type = "kustoQuery";
      wfNode.data.name = "kustoQuery1";
      wfNode.data.title = "Execute Kusto Query";
    } else if (type === nodeType.markdown) {
      wfNode.type = "markdown";
      wfNode.data.name = "markdown1";
      wfNode.data.title = "Display Markdown";
    }

    wfNode.children = [];
    wf.root = wfNode;
    let flow = new NgFlowchart.Flow(this.canvas);
    flow.upload(wf);
  }

}
