import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../../../shared/services/resource.service';
import { GithubApiService } from '../../../../shared/services/github-api.service';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { DetectorNodeComponent } from '../detector-node/detector-node.component';
import { KustoNodeComponent } from '../kusto-node/kusto-node.component';
import { MarkdownNodeComponent } from '../markdown-node/markdown-node.component';
import { nodeType, workflow, workflowNode, workflowNodeData, workflowPublishBody } from 'projects/diagnostic-data/src/lib/models/workflow';
import { IfElseConditionStepComponent } from '../ifelse-condition-step/ifelse-condition-step.component';
import { ConditionIffalseStepComponent } from '../condition-iffalse-step/condition-iffalse-step.component';
import { ConditionIftrueStepComponent } from '../condition-iftrue-step/condition-iftrue-step.component';
import { SwitchStepComponent } from '../switch-step/switch-step.component';
import { SwitchCaseDefaultStepComponent } from '../switch-case-default-step/switch-case-default-step.component';
import { SwitchCaseStepComponent } from '../switch-case-step/switch-case-step.component';
import { WorkflowService } from '../services/workflow.service';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AdalService } from 'adal-angular4';
import { WorkflowRootNodeComponent } from '../workflow-root-node/workflow-root-node.component';

@Component({
  selector: 'create-workflow',
  templateUrl: './create-workflow.component.html',
  styleUrls: ['./create-workflow.component.scss']
})
export class CreateWorkflowComponent implements OnInit, AfterViewInit {
  loadingCode: boolean = false;
  resourceId: string = '';
  searchStr = "";
  callbacks: NgFlowchart.Callbacks = {};
  publishBody: workflowPublishBody = new workflowPublishBody();
  options: NgFlowchart.Options = {
    stepGap: 40,
    rootPosition: 'TOP_CENTER',
    zoom: {
      mode: 'DISABLED'
    }
  };
  error: any;
  appTypes: string[] = ['WebApp', 'FunctionApp', 'ApiApp', 'MobileApp', 'GatewayApp', 'WorkflowApp', 'All'];
  platformTypes: string[] = ['Windows', 'Linux', 'HyperV', 'Kubernetes'];
  stackTypes: string[] = ['None', 'AspNet', 'NetCore', 'Php', 'Python', 'Node', 'Java', 'Static', 'SiteCore', 'Other', 'All'];
  selected = [];
  service: string = '';

  @ViewChild("selectAppType", { static: false }) selectAppType: NgSelectComponent;
  @ViewChild("selectPlatformType", { static: false }) selectPlatformType: NgSelectComponent;
  @ViewChild("selectStackType", { static: false }) selectStackType: NgSelectComponent;

  @ViewChild(NgFlowchartCanvasDirective)
  canvas: NgFlowchartCanvasDirective;

  disabled = false;
  nodeType = nodeType;
  chosenNodeType: nodeType = nodeType.kustoQuery;

  @Input() id: string = '';

  constructor(private stepRegistry: NgFlowchartStepRegistry, private _workflowService: WorkflowService,
    private _route: ActivatedRoute, private resourceService: ResourceService, private _adalService: AdalService,
    private githubService: GithubApiService) {
    this.callbacks.afterRender = this.afterRender.bind(this);
  }

  ngOnInit(): void {
    this.service = this.resourceService.service;
    if (this.id === '') {
      this.publishBody.IsInternal = true;
      let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
      this.publishBody.Author = alias.replace('@microsoft.com', '');
    } else {

      this.loadingCode = true;
      let allRouteQueryParams = this._route.snapshot.queryParams;
      let additionalQueryString = '';
      let knownQueryParams = ['startTime', 'endTime'];
      Object.keys(allRouteQueryParams).forEach(key => {
        if (knownQueryParams.indexOf(key) < 0) {
          additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
        }
      });

      this.githubService.getConfiguration(this.id.toLowerCase()).subscribe(packageJson => {
        this.publishBody.Id = packageJson.id;
        this.publishBody.Author = packageJson.Author;
        this.publishBody.Description = packageJson.Description;
        this.publishBody.IsInternal = packageJson.IsInternal;
        this.publishBody.WorkflowName = packageJson.name;

        if (this.resourceService.service === 'SiteService') {
          this.publishBody.AppType = packageJson.AppType;
          this.publishBody.Platform = packageJson.PlatForm;
          this.publishBody.StackType = packageJson.StackType;

          this.updateMultiSelect(this.publishBody.StackType, this.selectStackType, this.stackTypes);
          this.updateMultiSelect(this.publishBody.Platform, this.selectPlatformType, this.platformTypes);
          this.updateMultiSelect(this.publishBody.AppType, this.selectAppType, this.appTypes);
        }

        this.githubService.getWorkflow(this.id.toLowerCase()).subscribe(workflowJson => {
          this.canvas.getFlow().upload(workflowJson);
        }, error => {
          this.loadingCode = false;
          this.error = error;
        });
      }, error => {
        this.loadingCode = false;
        this.error = error;
      });
    }

  }

  ngAfterViewInit() {
    this.stepRegistry.registerStep('detector', DetectorNodeComponent);
    this.stepRegistry.registerStep('kustoQuery', KustoNodeComponent);
    this.stepRegistry.registerStep('markdown', MarkdownNodeComponent);
    this.stepRegistry.registerStep('ifelsecondition', IfElseConditionStepComponent);
    this.stepRegistry.registerStep('iffalse', ConditionIffalseStepComponent);
    this.stepRegistry.registerStep('iftrue', ConditionIftrueStepComponent);
    this.stepRegistry.registerStep('switchCondition', SwitchStepComponent);
    this.stepRegistry.registerStep('switchCaseDefault', SwitchCaseDefaultStepComponent);
    this.stepRegistry.registerStep('switchCase', SwitchCaseStepComponent);
    this.stepRegistry.registerStep('rootNode', WorkflowRootNodeComponent);

    if (this.id === '') {
      if (this.service === 'SiteService') {
        let item = this.selectAppType.itemsList.findByLabel('WebApp');
        this.selectAppType.select(item);

        item = this.selectPlatformType.itemsList.findByLabel('Windows');
        this.selectPlatformType.select(item);

        item = this.selectStackType.itemsList.findByLabel('All');
        this.selectStackType.select(item);
      }

      this.addRootNode();
    }
  }

  afterRender() {
  }

  uploadFlowData(json: string) {
    this.canvas.getFlow().upload(json);
  }

  showFlowData() {
    let json = this.canvas.getFlow().toJSON(4);
    const blob = new Blob([json], { type: 'text/json' });
    const link = document.createElement("a");

    link.download = this.publishBody.Id + "_workflow.json";
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
  }

  clearData() {
    this.canvas.getFlow().clear();
  }

  isDisabled() {
    return false;
  }

  onDelete(id) {
    this.canvas
      .getFlow()
      .getStep(id)
      .destroy(true);
  }

  getWorkflowPublishBody(): workflowPublishBody {
    if (!this.validateWorkflow()) {
      return null;
    }

    this.publishBody.WorkflowJson = this.canvas.getFlow().toJSON(4);
    return this.publishBody;
  }

  validateWorkflow(): boolean {
    if (!this.publishBody.Id || this.publishBody.Id.indexOf(' ') > -1) {
      this._workflowService.showMessageBox('Error', "Please specify a unique workflow Id without any spaces.");
      return false;
    }

    if (!this.publishBody.WorkflowName) {
      this._workflowService.showMessageBox('Error', "Please specify a workflow name.");
      return false;
    }

    if (!this.publishBody.Author) {
      this._workflowService.showMessageBox('Error', "Please specify the author for the workflow.");
      return false;
    }

    if (this.canvas.getFlow().getRoot() == null) {
      this._workflowService.showMessageBox('Error', "Please add at-least one node to the workflow.");
      return false;
    }

    if (this.canvas.getFlow().getRoot() != null) {
      let rootNode = this.canvas.getFlow().getRoot();
      if (rootNode.type === "rootNode") {
        this._workflowService.showMessageBox('Error', "Please add at-least one node to the workflow.");
        return false;
      }
    }

    return true;
  }

  onAppTypeChange(event: string[]) {
    this.publishBody.AppType = event.toString();
  }

  onPlatformTypeChange(event: string[]) {
    this.publishBody.Platform = event.toString();
  }

  onStackTypeChange(event: string[]) {
    this.publishBody.StackType = event.toString();
  }

  updateMultiSelect(selectedValues: string, selectComponent: NgSelectComponent, allValues: string[]) {
    selectedValues.split(',').forEach(selectedItem => {
      if (allValues.indexOf(selectedItem) > -1) {
        let option = selectComponent.itemsList.findItem(selectedItem);
        selectComponent.select(option);
      }
    })
  }

  addRootNode() {
    this._workflowService.addRootNode(this.canvas.getFlow());
  }
}