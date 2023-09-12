import { AfterViewInit, Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../../../shared/services/resource.service';
import { GithubApiService } from '../../../../shared/services/github-api.service';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { DetectorNodeComponent } from '../detector-node/detector-node.component';
import { KustoNodeComponent } from '../kusto-node/kusto-node.component';
import { MarkdownNodeComponent } from '../markdown-node/markdown-node.component';
import { kustoNode, nodeType, workflow, workflowNode, workflowPublishBody } from 'projects/diagnostic-data/src/lib/models/workflow';
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
import { ForeachNodeComponent } from '../foreach-node/foreach-node.component';
import { InputNodeComponent } from '../input-node/input-node.component';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../../services/applens-support-topic.service';
import { SupportTopicResult } from '../../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';

@Component({
  selector: 'create-workflow',
  templateUrl: './create-workflow.component.html',
  styleUrls: ['./create-workflow.component.scss']
})
export class CreateWorkflowComponent implements OnInit, AfterViewInit, OnChanges {
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
  workflowJsonString: string = '';
  addingSupportTopic: boolean = false;
  supportTopicPaths: string[] = [];
  chosenSupportTopic: string = '';
  allSupportTopics: SupportTopicResult[] = [];
  supportTopicsInUse: any[] = [];
  loadingExistingSupportTopics: boolean = true;

  @Input() id: string = '';
  @Input() Branch: string = '';

  constructor(private stepRegistry: NgFlowchartStepRegistry, private _workflowService: WorkflowService,
    private _route: ActivatedRoute, private resourceService: ResourceService, private _adalService: AdalService,
    private githubService: GithubApiService, private diagnosticApiService: ApplensDiagnosticService,
    private _supportTopicService: ApplensSupportTopicService) {
    this.callbacks.afterRender = this.afterRender.bind(this);
  }

  ngOnInit(): void {
    this.service = this.resourceService.service;

    //
    // Populate all Support Topics mapping in an in-memory object. This
    // allows us to map sapSupportTopicId to a friendly name later in UI
    // which someone wants to map support topics after marking detector public
    //

    this._supportTopicService.getSupportTopics().subscribe((allSupportTopics: SupportTopicResult[]) => {
      this.allSupportTopics = allSupportTopics;
      allSupportTopics.forEach(st => {
        this.supportTopicPaths.push(this.correctSupportTopicPath(st.supportTopicPath));
      });
      this.chosenSupportTopic = this.supportTopicPaths[0];
      this.populateSupportTopicsInUse();
      this.initialize();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.Branch) {
      return;
    }

    let branchNameArray = this.Branch.split("/");
    if (branchNameArray.length < 4) {
      return;
    }

    this.id = this.Branch.split("/")[3];
    this.initialize();
  }

  initialize() {
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

      this.resourceId = this.resourceService.getCurrentResourceId();
      this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/package.json`, this.Branch, this.resourceId).subscribe(resp => {
        if (resp) {
          let packageJson: object = JSON.parse(resp);
          this.updateWorkflowMetadata(packageJson);

          this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/workflow.json`, this.Branch, this.resourceId).subscribe(workflowJsonResp => {
            if (workflowJsonResp) {
              this.canvas.getFlow().upload(workflowJsonResp);
            }
            this.loadingCode = false;
          }, error => {
            this.loadingCode = false;
            this.error = error;
          });
        }
      }, error => {
        this.loadingCode = false;
        this.error = error;
      });
    }
  }

  updateWorkflowMetadata(packageJson: any) {
    if (packageJson) {
      this.publishBody.Id = packageJson.id;
      this.publishBody.Author = packageJson.Author;
      this.publishBody.Description = packageJson.Description;
      this.publishBody.IsInternal = packageJson.IsInternal;
      this.publishBody.WorkflowName = packageJson.name;
      this.publishBody.Category = packageJson.Category;
      this.publishBody.SupportTopicPaths = this.getSupportTopicPaths(packageJson.SupportTopicList);

      if (this.resourceService.service === 'SiteService') {
        this.publishBody.AppType = packageJson.AppType;
        this.publishBody.Platform = packageJson.PlatForm;
        this.publishBody.StackType = packageJson.StackType;

        this.updateMultiSelects();
      }
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
    this.stepRegistry.registerStep('foreach', ForeachNodeComponent);
    this.stepRegistry.registerStep('input', InputNodeComponent);
    this.stepRegistry.registerStep('rootNode', WorkflowRootNodeComponent);

    if (this.id === '') {
      if (this.resourceService.service === 'SiteService') {
        let item = this.selectAppType.itemsList.findByLabel('WebApp');
        this.selectAppType.select(item);

        item = this.selectPlatformType.itemsList.findByLabel('Windows');
        this.selectPlatformType.select(item);

        item = this.selectStackType.itemsList.findByLabel('All');
        this.selectStackType.select(item);
      }

      this.addRootNode();
    }

    if (this.workflowJsonString) {
      this.canvas.getFlow().upload(this.workflowJsonString);
    }

    this.updateMultiSelects();
  }

  updateMultiSelects() {
    this.updateMultiSelect(this.publishBody.StackType, this.selectStackType, this.stackTypes);
    this.updateMultiSelect(this.publishBody.Platform, this.selectPlatformType, this.platformTypes);
    this.updateMultiSelect(this.publishBody.AppType, this.selectAppType, this.appTypes);
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

    let workflowJson = this.canvas.getFlow().toJSON(4);
    this.publishBody.WorkflowJson = this.updateJsonToLatestSchema(workflowJson)
    return this.publishBody;
  }

  //
  // This is added to ensure that queryText property moves to 
  // data.kustoNode instead of data.queryText. Will remove this change
  // after updating all the published workflows.
  //

  updateJsonToLatestSchema(json: string): string {
    let workflowObject: workflow = JSON.parse(json);
    this.updateNode(workflowObject.root);
    return JSON.stringify(workflowObject, null, 4);
  }

  updateNode(node: workflowNode) {
    if (node.type === 'kustoQuery') {
      if (node.data.kustoNode == null) {
        node.data.kustoNode = new kustoNode();
      }
      if (!node.data.kustoNode.queryText) {
        node.data.kustoNode.queryText = node.data.queryText;
        delete node.data['queryText'];
      }
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => this.updateNode(child));
    }
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
    if (selectedValues == null) {
      return;
    }

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

  addSupportTopic() {

    //
    // Make sure that the chosenSupportTopic is not mapped to an already existing
    // detector or workflow. If it is, bail out and throw error to end user
    //

    let existingIndex = this.supportTopicsInUse.findIndex(x => x.supportTopicPath === this.chosenSupportTopic);
    if (existingIndex > -1) {
      let existingEntity = this.supportTopicsInUse[existingIndex].id;
      this._workflowService.showMessageBox("Error", `The support topic <strong>${this.chosenSupportTopic}</strong> cannot be used as it is already mapped to an existing detector or workflow - <strong>${existingEntity}</strong>. Please first remove the support topic mapping for the existing detector or choose a different support topic.`);
      return;
    }


    //
    // Ensure user is not choosing a support topic that already exists in the list
    //

    let idx = this.publishBody.SupportTopicPaths.findIndex(x => x === this.chosenSupportTopic);
    if (idx === -1) {
      this.publishBody.SupportTopicPaths.push(this.chosenSupportTopic);
      this.addingSupportTopic = false
    } else {
      this._workflowService.showMessageBox("Error", `The Support Topic '${this.chosenSupportTopic}' is already selected for this workflow`);
    }
  }

  deleteSupportTopic(supportTopicPath: string) {
    let idx = this.publishBody.SupportTopicPaths.findIndex(x => x === supportTopicPath);
    if (idx > -1) {
      this.publishBody.SupportTopicPaths.splice(idx, 1);
    }
  }

  //
  // Existing workflows will fetch Support Topic mapping from package.json. That mapping
  // does not have the friendly SupportTopicPath. Do the hard work of getting supportTopicPath
  // from sapProductId and sapSupportTopicId from an in-memory cache 
  //

  getSupportTopicPaths(supportTopicList: []): string[] {
    if (supportTopicList == null) {
      return [];
    }

    let supportTopicPaths: string[] = [];
    supportTopicList.forEach((supportTopic: any) => {
      let idx = this.allSupportTopics.findIndex(x => x.sapProductId === supportTopic.SapProductId && x.sapSupportTopicId === supportTopic.SapSupportTopicId);
      if (idx > -1) {
        supportTopicPaths.push(this.correctSupportTopicPath(this.allSupportTopics[idx].supportTopicPath));
      }
    });
    return supportTopicPaths;
  }

  //
  // Replace '/' in Support Topic paths with '\'
  //

  correctSupportTopicPath(supportTopicPath: string): string {
    const pieces = supportTopicPath.split('/');
    return pieces.join('\\');
  }


  //
  // Populate the supportTopicPath used in existing detectors and workflows in an
  // in-memory cache to ensure that they are not re-used.
  //

  populateSupportTopicsInUse() {
    this.diagnosticApiService.getDetectors().subscribe(detectors => {
      this.addSupportTopicEntitiesToCache(detectors);
      this.diagnosticApiService.getWorkflows().subscribe(workflows => {
        this.addSupportTopicEntitiesToCache(workflows);

        //
        // set this flag to true to ensure the dropdown is
        // visible. Till then, a loading animation will show
        //

        this.loadingExistingSupportTopics = false;
      });
    });
  }

  addSupportTopicEntitiesToCache(entities: DetectorMetaData[]) {
    if (entities && entities.length > 0) {
      entities.forEach(entity => {
        if (entity.supportTopicList && entity.supportTopicList.length > 0 && entity.id != this.id) {
          entity.supportTopicList.forEach(st => {
            this.addExistingSupportTopic(entity.id, st);
          });
        }
      });
    }
  }

  addExistingSupportTopic(id: string, st: SupportTopic) {
    let idx = this.allSupportTopics.findIndex(x => x.sapSupportTopicId === st.sapSupportTopicId && x.sapProductId === st.sapProductId);
    if (idx > -1) {

      //
      // Fetch supportTopicPath and entityId and save it to cache
      // to validate later when choosing support topics.
      //

      this.supportTopicsInUse.push({ id: id, supportTopicPath: this.correctSupportTopicPath(this.allSupportTopics[idx].supportTopicPath) });
    }
  }

  refreshVariables() {
    let rootNode = this.canvas.getFlow().getRoot();
    if (rootNode != null) {
      this._workflowService.refreshVariables(rootNode);
      let wf = new workflow();
      wf.root = rootNode;
      let jsonString = JSON.stringify(wf, null, 4);
      this.canvas.getFlow().upload(jsonString);
      this._workflowService.showMessageBox("Success", "Variables refreshed successfully", false);
    }
  }
}