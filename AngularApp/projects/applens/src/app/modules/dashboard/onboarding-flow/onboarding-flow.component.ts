import { AdalService } from 'adal-angular4';
import {
  CompilationProperties, DetectorControlService, DetectorResponse, HealthStatus, QueryResponse, CompilationTraceOutputDetails, LocationSpan, Position, GenericThemeService, StringUtilities, QueryResponseService, ChatUIContextService, UserAccessStatus
} from 'diagnostic-data';
import * as moment from 'moment';
import { NgxSmartModalService } from 'ngx-smart-modal';
import {
  forkJoin
  , Observable, of
} from 'rxjs';
import { flatMap, map } from 'rxjs/operators'
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Package } from '../../../shared/models/package';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { DetectorGistApiService } from '../../../shared/services/detectorgist-template-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { RecommendedUtterance, RenderingType } from '../../../../../../diagnostic-data/src/public_api';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { ActivatedRoute, Params, Router } from "@angular/router";
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";
import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import { MonacoLanguageClient, CloseAction, ErrorAction, MonacoServices, createConnection } from 'monaco-languageclient';
import { v4 as uuid } from 'uuid';
import { IButtonStyles, IChoiceGroupOption, IDialogContentProps, IDropdownOption, IDropdownProps, IPanelProps, IPivotProps, MessageBarType, PanelType } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { Commit } from '../../../shared/models/commit';
import { ApplensCommandBarService } from '../services/applens-command-bar.service';
import { DevopsConfig } from '../../../shared/models/devopsConfig';
import { ApplensGlobal } from '../../../applens-global';
import { IDeactivateComponent } from '../develop-navigation-guard.service';
import { DocumentationFilesList } from '../side-nav/documentationFilesList';
import { DocumentMode } from '../applens-docs/applens-docs.component';
import { CreateWorkflowComponent } from '../workflow/create-workflow/create-workflow.component';
import { workflowNodeResult, workflowPublishBody } from 'projects/diagnostic-data/src/lib/models/workflow';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { WorkflowRunDialogComponent } from '../workflow/workflow-run-dialog/workflow-run-dialog.component';
import { UserSettingService } from '../services/user-setting.service';
import { WorkflowService } from '../workflow/services/workflow.service';
import { ApplensCopilotContainerService } from '../services/copilot/applens-copilot-container.service';
import { ApplensDetectorDevelopmentCopilotService } from '../services/copilot/applens-detector-development-copilot.service';

const codePrefix = `// *****PLEASE DO NOT MODIFY THIS PART*****
using Diagnostics.DataProviders;
using Diagnostics.ModelsAndUtils.Utilities;
using Diagnostics.ModelsAndUtils.Models;
using Diagnostics.ModelsAndUtils.Models.ResponseExtensions;
using Diagnostics.ModelsAndUtils.Attributes;
using Diagnostics.ModelsAndUtils.ScriptUtilities;
using Kusto.Data;
//*****END OF DO NOT MODIFY PART*****
`;

const newDetectorId: string = "NEW_DETECTOR";

export enum DevelopMode {
  Create,
  Edit,
  EditMonitoring,
  EditAnalytics
}

@Component({
  selector: 'onboarding-flow',
  templateUrl: './onboarding-flow.component.html',
  styleUrls: ['./onboarding-flow.component.scss']
})
export class OnboardingFlowComponent implements OnInit, OnDestroy, IDeactivateComponent {

  @ViewChild(CreateWorkflowComponent) createWorkflow: CreateWorkflowComponent;

  @Input() mode: DevelopMode = DevelopMode.Create;
  @Input() id: string = '';
  @Input() dataSource: string = '';
  @Input() timeRange: string = '';
  @Input() startTime: moment.Moment = moment.utc().subtract(1, 'days');
  @Input() endTime: moment.Moment = moment.utc();
  @Input() gistMode: boolean = false;
  @Input() branchInput: string = '';
  @Input() isWorkflowDetector: boolean = false;
  DevelopMode = DevelopMode;
  HealthStatus = HealthStatus;
  PanelType = PanelType;
  DocumentMode = DocumentMode;

  isShieldEmbedded: boolean = false;
  hideModal: boolean = true;
  fileName: string;
  editorOptions: any;
  lightOptions: any;
  darkOptions: any;
  code: string;
  originalCode: string;
  reference: object = {};
  configuration: object = {};
  resourceId: string;
  queryResponse: QueryResponse<DetectorResponse>;
  workflowQueryResponse: QueryResponse<workflowNodeResult>;
  errorState: any;
  buildOutput: string[];
  detailedCompilationTraces: CompilationTraceOutputDetails[];
  public showDetailedCompilationTraces: boolean = true;
  runButtonDisabled: boolean;
  publishButtonDisabled: boolean;
  localDevButtonDisabled: boolean;
  localDevText: string;
  localDevUrl: string;
  localDevIcon: string;
  devOptionsIcon: string;
  runButtonText: string;
  runButtonIcon: string;
  publishButtonText: string;
  gists: string[] = [];
  allGists: string[] = [];
  selectedGist: string = '';
  temporarySelection: object = {};
  allUtterances: any[] = [];
  recommendedUtterances: RecommendedUtterance[] = [];
  utteranceInput: string = "";
  dialogTitle: string = "Send for review";
  dialogSubText: string = "Changes will be reviewed by team before getting merged. Once published, you will have a link to the PR.";
  branchName: string = "Branch Name";
  branchPlaceholder: string = "Enter Branch name";
  PRName: string = "Pull Request Name";
  PRPlaceholder: string = "Enter PR Name";
  PRDescription: string = "Pull Request description";
  PRDescriptionPlaceholder: string = "Enter description about the changes";
  cancelButtonText: string = "Cancel";
  publishDialogHidden: boolean = true;
  PRTitle: string = "";
  PRDesc: string = "";
  Branch: string = "";
  tempBranch: string = "";
  showBranches: IChoiceGroupOption[] = [{ key: "", text: "" }];
  displayBranch: string = "";
  optionsForSingleChoice: IChoiceGroupOption[] = [];
  openTimePickerCallout: boolean = false;
  timePickerButtonStr: string = "";
  showCalendar: boolean = false;
  showTimePicker: boolean = false;
  gistDialogHidden: boolean = true;
  gistVersion: string;
  latestGistVersion: string = "";
  gistName: string;
  pastGistEvent: any;
  pastGistVersionEvent: any;
  gistVersionChanged: boolean = false;
  applyGistButtonDisabled: boolean = true;
  refreshGistButtonDisabled: boolean = true;
  loadingGistVersions: boolean = false;
  refreshGistListButtonIcon: any = { iconName: 'Refresh' };
  gistsDropdownOptions: IDropdownOption[] = [];
  gistVersionOptions: IDropdownOption[] = [];
  gistUpdateTitle: string = '';
  internalExternalText: string = "";
  internalViewText: string = "Internal view";
  externalViewText: string = "Customer view";
  defaultSelectedKey: string;
  currentTime: string = "";
  publishSuccess: boolean = false;
  publishFailed: boolean = false;
  saveSuccess: boolean = false;
  saveFailed: boolean = false;
  deleteSuccess: boolean = false;
  deleteFailed: boolean = false;
  saveIdFailure: boolean = false;
  badBranchNameFailure: boolean = false;
  saveButtonText: string = "Save";
  detectorName: string = "";
  submittedPanelTimer: any = null;
  deleteButtonText: string = "Delete";
  deleteDialogTitle: string = "Delete Detector";
  deleteDialogHidden: boolean = true;
  detectorReferencesTitle: string = "Detector References";
  deleteAvailable: boolean = false;
  deletingDetector: boolean = false;
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  failureMessage: string = "";
  PPERedirectTimer: number = 10;
  DevopsConfig: DevopsConfig;
  useAutoMergeText: boolean = false;
  detectorReferencesDialogHidden: boolean = true;
  gistCommitVersion: string = "";
  charWarningMessage: string = '';
  detectorLoaded: boolean = false;
  workflowPackage: Package;

  // copilot variables
  copilotEnabled: boolean = true;
  copilotCodeSuggestionObservable: any;
  copilotCodeUpdateProgressStateObservable: any;
  copilotServiceMembersInitialized: boolean = false;

  runButtonStyle: any = {
    root: { cursor: "default" }
  };
  publishButtonStyle: any = {
    root: {
      cursor: "not-allowed",
      color: "grey"
    }
  };
  saveButtonVisibilityStyle: any = {};
  saveButtonDisabled: boolean = false;
  PRLink: string = "";

  detectorGraduation: boolean = false;
  disableDelete: boolean = false;

  buttonStyle: IButtonStyles = {
    root: {
      //  color: "#323130",
      borderRadius: "12px",
      marginTop: "8px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "13",
      fontWeight: "600",
      height: "80%"
    }
  }
  branchButtonDisabled = false;
  branchButtonStyle: IButtonStyles = {
    root: {
      //   color: "#323130",
      borderRadius: "12px",
      marginTop: "8px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "10",
      fontWeight: "600",
      height: "80%"
    }
  }
  pivotStyle: IPivotProps['styles'] = {
    root: {
    }
  }
  examplesDropdownStyle: IDropdownProps['styles'] = {
    root: {
      width: "95%",
      maxWidth: "332px"
    }
  }
  documentsList: DocumentationFilesList = new DocumentationFilesList();
  examplesDropdownOptions: IDropdownProps['options'];
  exampleCat: string = "";
  exampleDoc: string = "";
  showExample: boolean = false;

  runIcon: any = { iconName: 'Play' };

  publishIcon: any = {
    iconName: 'Upload',
    styles: {
      root: { color: "grey" }
    }
  };

  submittedPanelStyles: IPanelProps["styles"] = {
    root: {
      height: "100px",
    },
    content: {
      padding: "0px"
    },
    navigation: {
      height: "18px"
    }
  }

  publishDialogStyles: IDialogContentProps['styles'] = {
    inner: {
      paddingLeft: "24px"
    },
    innerContent: {
      padding: "0px"
    }
  }

  dataSources: IDropdownOption[] = [
    {
      key: "1",
      text: "Applens"
    },
    {
      key: "2",
      text: "Portal"
    },
    {
      key: "0",
      text: "All"
    }
  ];

  modalPublishingButtonText: string;
  modalPublishingButtonDisabled: boolean;
  publishAccessControlResponse: any;

  alertClass: string;
  alertMessage: string;
  showAlert: boolean;

  compilationPackage: CompilationProperties;

  initialized = false;
  codeLoaded: boolean = false;

  lastSavedVersion: string;
  detectorDeleted: boolean = false;

  lastSavedId: string = "";
  idMatches: boolean = false;

  codeCompletionEnabled: boolean = false;
  languageServerUrl: any = null;

  private publishingPackage: Package;
  private userName: string;
  private userId: string;

  private emailRecipients: string = '';
  private _monacoEditor: monaco.editor.ICodeEditor = null;
  private _oldCodeDecorations: string[] = [];
  selectedKey: string = '';
  isSaved: boolean = false;
  notificationStatusType: MessageBarType = MessageBarType.success;
  branchMessageStyle: any = {
    root: {
      height: '20px',
      backgroundColor: '#c9dded',
    }
  }
  showBranchInfo: boolean = false;
  owners: string[] = [];
  //to direct system invoker detectors to the correct repo
  SYSTEM_INVOKER_RESOURCE_ID: string = '';
  SYSTEM_INVOKER_MAIN_BRANCH: string = '';

  codeOnDefaultBranch: boolean = false;
  workflowPublishBody: workflowPublishBody;
  workflowId: string = '';

  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService, private detectorGistApiService: DetectorGistApiService,
    private diagnosticApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService,
    public ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService, private _activatedRoute: ActivatedRoute,
    private _applensCommandBarService: ApplensCommandBarService, private _router: Router, private _themeService: GenericThemeService, private _applensGlobal: ApplensGlobal,
    private matDialog: MatDialog, private _queryResponseService: QueryResponseService, private _userSettingService: UserSettingService,
    private _workflowService: WorkflowService, public _chatContextService: ChatUIContextService, public _copilotContainerService: ApplensCopilotContainerService, public _detectorDevelopmentCopilotService: ApplensDetectorDevelopmentCopilotService) {
    this.lightOptions = {
      theme: 'vs',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true,
      readOnly: false
    };

    this.darkOptions = {
      theme: 'vs-dark',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true,
      readOnly: false
    };

    this.editorOptions = this.lightOptions;
    this.buildOutput = [];
    this.detailedCompilationTraces = [];
    this.localDevButtonDisabled = false;
    this.runButtonDisabled = false;
    this.publishButtonDisabled = true;
    this.localDevText = "Download Local Detector Package";
    this.localDevUrl = "";
    this.localDevIcon = "fa fa-download";
    this.devOptionsIcon = "fa fa-download";
    this.runButtonText = "Run";
    this.runButtonIcon = "fa fa-play";
    this.publishButtonText = "Create";
    this.modalPublishingButtonText = this.detectorGraduation ? "Create PR" : "Publish";
    this.modalPublishingButtonDisabled = false;
    this.showAlert = false;

    this.userName = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.emailRecipients = this.userName.replace('@microsoft.com', '');
    this.userId = this.userName.replace('@microsoft.com', '');
    this.publishAccessControlResponse = {};
    this._detectorDevelopmentCopilotService.detectorAuthor = this.userId;
  }

  ngOnInit() {
    this.copilotServiceMembersInitialized = false;
    this._activatedRoute.params.subscribe((params: Params) => {
      this.initialized = false;
      this.startUp();
    });
  }

  ngOnDestroy() {
    clearInterval(this.redirectTimer);
    this._router.navigate([], {
      queryParams: {
        'branchInput': null,
      },
      queryParamsHandling: 'merge'
    });

    if (this.copilotServiceMembersInitialized) {

      if (this.copilotCodeSuggestionObservable) {
        this.copilotCodeSuggestionObservable.unsubscribe();
      }

      if (this.copilotCodeUpdateProgressStateObservable) {
        this.copilotCodeUpdateProgressStateObservable.unsubscribe();
      }

      this._copilotContainerService.onCloseCopilotPanelEvent.next({ showConfirmation: false, resetCopilot: true });

    }
  }

  canExit(): boolean {
    if (this.detectorDeleted)
      return true;
    else if (!!this.lastSavedVersion && !StringUtilities.Equals(this.code, this.lastSavedVersion)) {
      if (confirm("Are you sure you want to leave? You have some unsaved changes.")) {
        return true;
      }
      else {
        return false;
      }
    }
    else if (this._detectorDevelopmentCopilotService.operationInProgress) {
      if (confirm("Are you sure you want to leave? Looks like Copilot operation is in progress.")) {
        return true;
      }
      else {
        return false;
      }
    }
    else
      return true;
  }

  updateDataSources(event: string) {
    console.log(event);
  }

  showDeleteDialog() {
    this.deleteDialogHidden = false;
    this.setTargetBranch();
  }

  dismissDeleteDialog() {
    this.deleteDialogHidden = true;
  }


  updateTempBranch(event: any) {
    this.tempBranch = event.option.key;
  }

  systemInvokerUpdateBranch() {
    this.Branch = this.tempBranch;
    this.displayBranch = this.Branch;
    let sysId = this.mode === DevelopMode.EditMonitoring ? '__monitoring' : `__analytics`;
    this.diagnosticApiService.getDetectorCode(`${sysId.toLowerCase()}/${sysId.toLowerCase()}.csx`, this.Branch, this.SYSTEM_INVOKER_RESOURCE_ID).subscribe(x => {
      this.code = x;
      this.lastSavedVersion = this.code;
    });
  }

  updateBranch() {
    if (this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics)
      this.systemInvokerUpdateBranch();
    else {
      this.Branch = this.tempBranch;
      this.displayBranch = this.Branch;
      if (this.mode === DevelopMode.Create) this.diagnosticApiService.getDetectorCode(`${this.Branch.split('/')[3].toLowerCase()}/${this.Branch.split('/')[3].toLowerCase()}.csx`, this.Branch, this.resourceId).subscribe(x => {
        this.code = x;
        this.lastSavedVersion = this.code;
        this.lastSavedId = this.Branch.split('/')[3].toLowerCase();
        this.detectorLoaded = true;
      });
      else this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx`, this.Branch, this.resourceId).subscribe(x => {
        this.code = x;
        this.lastSavedVersion = this.code
      });
    }
    this.closeCallout();
  }

  noBranchesAvailable() {
    this.displayBranch = "NA (not published)";
    this.disableBranchButton();
  }

  disableBranchButton() {
    this.branchButtonDisabled = true;
    this.branchButtonStyle = {
      root: {
        cursor: "not-allowed",
        color: "#323130",
        borderRadius: "12px",
        marginTop: "8px",
        background: "#eaeaea",
        fontSize: "13",
        fontWeight: "600",
        height: "80%"
      }
    };
  }

  branchChoiceCharLimit: number = 25;
  defaultBranch: string;

  publishWorkflow() {
    this._diagnosticApi.isUserAllowedForWorkflow(this.userId).subscribe(resp => {
      if (resp) {
        this.runButtonDisabled = true;
        this.publishButtonDisabled = true;
        this.modalPublishingButtonText = "Publishing...";

        let publishBody = this.createWorkflow.getWorkflowPublishBody();
        if (publishBody == null) {
          return;
        }

        publishBody.CommittedByAlias = this.userName;
        this.diagnosticApiService.publishWorkflow(publishBody).subscribe(resp => {
          this.runButtonDisabled = false;
          this.modalPublishingButtonText = "Publish";
          this.publishSuccess = true;
        }, error => {
          this.modalPublishingButtonText = "Publish";
          this.runButtonDisabled = false;
          this.showAlertBox('alert-danger', 'Publishing failed. Please try again after some time.');
        });
      } else {
        this._workflowService.showMessageBoxWithFooter('Error',
          `Workflow publishing is not open to everyone yet. The user '${this.userId}' does not have access to publish workflows. Please request access to this feature by clicking below. <br/><br/>Also, <strong>download the workflow</strong> to ensure you don't loose your created workflow.`,
          "<a target='_blank' href='mailto:applensv2team@microsoft.com?subject=Requesting Workflow Publishing Access&body=Please provide access to &lt;Enter your alias&gt;'>Request Access</a>");
      }
    });

  }

  publishButtonOnClick() {
    if (this.detectorGraduation) {
      this.showPublishDialog();
    }
    else {
      this.ngxSmartModalService.getModal('publishModal').open();
    }
  }

  ableToDelete: boolean = false;
  deleteVisibilityStyle = {};
  commitHistoryVisibilityStyle = {};
  commitHistoryLink: string = "";

  isProd: boolean = false;
  PPELink: string;
  PPEHostname: string;
  redirectTimer: NodeJS.Timer;

  startUp() {
    this._queryResponseService.getQueryResponse().subscribe(qr => {
      this.queryResponse = qr;
    });

    //
    // Disable Save button by default for Workflows. This should get enabled only on a
    // successful Workflow run compilation.
    //

    if (this.isWorkflowDetector) {
      this.disableSaveButton();
    }

    this.detectorGraduation = true;
    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;
    this.branchInput = this._activatedRoute.snapshot.queryParams['branchInput'];
    if (isSystemInvoker) {
      this._diagnosticApi.getAppSetting("SystemInvokers:ResourceIDString").subscribe(resource => {
        this.SYSTEM_INVOKER_RESOURCE_ID = resource;
      });
      this._diagnosticApi.getAppSetting("SystemInvokers:DiagnosticsMainBranch").subscribe(bn => {
        this.SYSTEM_INVOKER_MAIN_BRANCH = bn;
      });
    }

    this.diagnosticApiService.getDevopsConfig(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(devopsConfig => {
      this.detectorGraduation = devopsConfig.graduationEnabled;
      this.DevopsConfig = new DevopsConfig(devopsConfig);

      this.commitHistoryLink = (devopsConfig.folderPath === "/") ? `https://dev.azure.com/${devopsConfig.organization}/${devopsConfig.project}/_git/${devopsConfig.repository}?path=${devopsConfig.folderPath}${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx&_a=history` : `https://dev.azure.com/${devopsConfig.organization}/${devopsConfig.project}/_git/${devopsConfig.repository}?path=${devopsConfig.folderPath}/${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx&_a=history`;

      this.deleteVisibilityStyle = !(this.detectorGraduation === true && this.mode !== DevelopMode.Create) ? { display: "none" } : {};
      this.saveButtonVisibilityStyle = !(this.detectorGraduation === true) ? { display: "none" } : {};
      this.commitHistoryVisibilityStyle = !(this.detectorGraduation === true && this.mode !== DevelopMode.Create) ? { display: "none" } : {};

      this.modalPublishingButtonText = this.detectorGraduation && !devopsConfig.autoMerge ? "Create PR" : "Publish";

      this._themeService.currentThemeSub.subscribe((theme) => {
        this.editorOptions = theme == "dark" ? this.darkOptions : this.lightOptions;
        this.submittedPanelStyles = {
          root: {
            height: "100px",
            color: this._themeService.getPropertyValue("--bodyText"),
          },
          content: {
            padding: "0px"
          },
          navigation: {
            height: "18px"
          }
        }
      });

      if (isSystemInvoker)
        this.getSystemInvokerBranchList();
      else if (this.detectorGraduation)
        this.getBranchList();

      if (!this.initialized && !this.detectorGraduation) {
        this.initialize();
        this.initialized = true;
        this._telemetryService.logPageView(TelemetryEventNames.OnboardingFlowLoaded, {});
      }

      this.diagnosticApiService.getPPEHostname().subscribe(host => {
        this.PPEHostname = host;
        this.diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
          this.PPELink = `${this.PPEHostname}${this._router.url}`;
          this.isProd = env === "Prod";
          if (this.isProd) {
            window.open(this.PPELink, '_blank');
            this.mode === DevelopMode.Create ? window.open(this._router.url.replace('/create?', '?'), '_self') : window.open(this._router.url.replace('/edit?', '?'), '_self');
          }
        });
      });

      this._detectorControlService.timePickerStrSub.subscribe(s => {
        this.timePickerButtonStr = s;
      });

      if (this._detectorControlService.isInternalView) {
        this.internalExternalText = this.internalViewText;
      }
      else {
        this.internalExternalText = this.externalViewText;
      }
    });

    this._diagnosticApi.get<boolean>('api/openai/detectorcopilot/enabled?detectorMode=develop').subscribe(res => {

      this.copilotEnabled = res &&
        isSystemInvoker == false &&
        this.isWorkflowDetector == false;
    });
  }

  getSystemInvokerBranchList() {
    this.optionsForSingleChoice = [];
    //callout stops working if showBranches ever becomes empty
    this.showBranches = [{ key: "", text: "" }];
    let sysId = this.mode === DevelopMode.EditMonitoring ? '__monitoring' : `__analytics`;

    this.diagnosticApiService.getBranches(this.SYSTEM_INVOKER_RESOURCE_ID).subscribe(branches => {
      var branchRegEx = new RegExp(`^dev\/.*\/detector\/${sysId}$`, "i");
      branches.forEach(option => {
        this.optionsForSingleChoice.push({
          key: String(option["branchName"]),
          text: String(option["branchName"])
        });

        if (option["isMainBranch"].toLowerCase() === "true") {
          this.defaultBranch = String(option["branchName"]);
        }
        if ((option["isMainBranch"].toLowerCase() === "true")) {
          this.showBranches.push({
            key: String(option["branchName"]),
            text: String(option["branchName"])
          });
        }
      });

      this.optionsForSingleChoice.forEach(branch => {
        if (branchRegEx.test(branch.text) && sysId.toLowerCase() != "") {
          this.showBranches.push({
            key: String(branch.key),
            text: String(`${branch.text.split("/")[1]} : ${branch.text.split("/")[3]}`)
          });
        }
      });

      // remove temp value from showBranches
      this.showBranches = this.showBranches.filter(branchName => {
        return branchName.key != '';
      });

      if (this.showBranches.length < 1) {
        this.noBranchesAvailable();
      }
      else {
        var targetBranch = this.gistMode ? `dev/${this.userName.split("@")[0]}/gist/${sysId.toLowerCase()}` : `dev/${this.userName.split("@")[0]}/detector/${sysId.toLowerCase()}`;

        this.Branch = this.targetInShowBranches(targetBranch) ? targetBranch : this.showBranches[0].key;
        this.displayBranch = this.Branch;
        this.tempBranch = this.Branch;
        this.updateBranch();
        this.showBranchInfo = true;
      }

      if (!this.initialized) {
        this.initialize();
        this.initialized = true;
        this._telemetryService.logPageView(TelemetryEventNames.OnboardingFlowLoaded, {});
      }
    });

  }

  getBranchList() {
    this.optionsForSingleChoice = [];
    //callout stops working if showBranches ever becomes empty
    this.showBranches = [{ key: "", text: "" }];
    this.resourceId = this.resourceId == undefined || this.resourceId == '' ? this.resourceService.getCurrentResourceId() : this.resourceId;
    this.diagnosticApiService.getBranches(this.resourceId).subscribe(branches => {
      this.diagnosticApiService.getDetectors().subscribe(listDetectors => {

        if (this.mode != DevelopMode.Create) {
          var branchRegEx = this.gistMode ? new RegExp(`^dev\/.*\/gist\/${this.id}$`, "i") : new RegExp(`^dev\/.*\/detector\/${this.id}$`, "i");
          if (this.isWorkflowDetector) {
            branchRegEx = new RegExp(`^dev\/.*\/workflow\/${this.id}$`, "i")
          }
          branches.forEach(option => {
            this.optionsForSingleChoice.push({
              key: String(option["branchName"]),
              text: String(option["branchName"])
            });
            if (option["isMainBranch"].toLowerCase() === "true") {
              this.defaultBranch = String(option["branchName"]);
              this.showBranches.push({
                key: String(option["branchName"]),
                text: String(option["branchName"])
              });
            }
          })
        }
        else {
          var branchRegEx = this.gistMode ? new RegExp(`^dev\/.*\/gist\/.*$`, "i") : new RegExp(`^dev\/.*\/detector\/.*$`, "i");
          if (this.isWorkflowDetector) {
            branchRegEx = new RegExp(`^dev\/.*\/workflow\/.*$`, "i")
          }

          let idList = [];
          listDetectors.forEach(det => {
            idList.push(det.id.toLowerCase());
          });
          branches = branches.filter(bn => {
            return !idList.includes(bn["branchName"].split("/").length >= 4 ? bn["branchName"].split("/")[3].toLowerCase() : bn["branchName"]);
          })
          branches.forEach(option => {
            if (option["isMainBranch"].toLowerCase() != "true")
              this.optionsForSingleChoice.push({
                key: String(option["branchName"]),
                text: String(option["branchName"])
              });
            if (option["isMainBranch"].toLowerCase() === "true") {
              this.defaultBranch = String(option["branchName"]);
            }
          })
        }

        this.optionsForSingleChoice.forEach(branch => {
          if (branchRegEx.test(branch.text)) {
            this.showBranches.push({
              key: String(branch.key),
              text: String(`${branch.text.split("/")[1]} : ${branch.text.split("/")[3]}`)
            });
          }
        });
        // remove temp value from showBranches
        this.showBranches = this.showBranches.filter(branchName => {
          return branchName.key != '';
        });
        if (this.showBranches.length < 1 || this.mode == DevelopMode.EditMonitoring || this.mode == DevelopMode.EditAnalytics) {
          this.noBranchesAvailable();
        }
        else {
          if (this.mode != DevelopMode.Create) {
            var targetBranch = this.gistMode ? `dev/${this.userName.split("@")[0]}/gist/${this.id.toLowerCase()}` : `dev/${this.userName.split("@")[0]}/detector/${this.id.toLowerCase()}`;
            // if a branch is present via query params, default to that branch.
            if (this.branchInput != undefined && this.branchInput != '' && this.mode == DevelopMode.Edit) {
              this.Branch = this.branchInput;
              this.displayBranch = this.Branch;
              this.tempBranch = this.Branch;
            } else {
              this.Branch = this.targetInShowBranches(targetBranch) ? targetBranch : this.showBranches[0].key;
              this.displayBranch = this.Branch;
              this.tempBranch = this.Branch;
            }
            this.updateBranch();
            this.showBranchInfo = true;
          }
          else {
            this.displayBranch = "NA (not published)";
          }
        }
        if (!this.initialized) {
          this.initialize();
          this.initialized = true;
          this._telemetryService.logPageView(TelemetryEventNames.OnboardingFlowLoaded, {});
        }

      });
    });
  }

  internalExternalToggle() {
    if (this.internalExternalText === this.externalViewText) {
      this.internalExternalText = this.internalViewText;
    }
    else {
      this.internalExternalText = this.externalViewText;
    }

    this._detectorControlService.toggleInternalExternal();
  }

  addCodePrefix(codeString) {
    if (this.codeCompletionEnabled) {
      try {
        // Index of #load
        var isLoadIndex = codeString.indexOf("#load");
        // If gist is being loaded in the code
        if (isLoadIndex >= 0) {
          codeString = StringUtilities.ReplaceAll(codeString, codePrefix, "");
          var splitted = codeString.split("\n");
          var lastIndex = splitted.slice().reverse().findIndex(x => x.startsWith("#load") || x.trim().startsWith("#load"));
          lastIndex = lastIndex > 0 ? splitted.length - 1 - lastIndex : lastIndex;
          if (lastIndex >= 0) {
            var finalJoin = [...splitted.slice(0, lastIndex + 1), codePrefix, ...splitted.slice(lastIndex + 1,)].join("\n");
            return finalJoin;
          }
        }
        // No gist scenario
        else {
          codeString = StringUtilities.ReplaceAll(codeString, codePrefix, "");
        }
        return codePrefix + codeString;
      }
      catch (err) { }
    }
    return codeString;
  }

  onInit(editor: any) {
    this._monacoEditor = editor;
    let getEnabled = this._diagnosticApi.get('api/appsettings/CodeCompletion:Enabled');
    let getServerUrl = this._diagnosticApi.get('api/appsettings/CodeCompletion:LangServerUrl');
    try {
      forkJoin([getEnabled, getServerUrl]).subscribe(resList => {
        this._userSettingService.getUserSetting().subscribe(res => {
          let userCodeCompletionEnabled = res && res.codeCompletion == "off" ? false : true;
          this.codeCompletionEnabled = (resList[0] == true || resList[0].toString().toLowerCase() == "true") && userCodeCompletionEnabled;
          this.languageServerUrl = resList[1];
          if (this.codeCompletionEnabled && this.languageServerUrl && this.languageServerUrl.length > 0) {
            if (this.code.indexOf(codePrefix) < 0) {
              this.code = this.addCodePrefix(this.code);
              this.lastSavedVersion = this.code;
              this.initalizeCoPilotServiceMembers();
            }
            let fileName = uuid();
            let editorModel = monaco.editor.createModel(this.code, 'csharp', monaco.Uri.parse(`file:///workspace/${fileName}.cs`));
            editor.setModel(editorModel);
            MonacoServices.install(editor, { rootUri: "file:///workspace" });
            const webSocket = this.createWebSocket(this.languageServerUrl);

            listen({
              webSocket,
              onConnection: connection => {
                // create and start the language client
                const languageClient = this.createLanguageClient(connection);
                const disposable = languageClient.start();
                connection.onClose(() => disposable.dispose());
              }
            });
          }
        });
      },
        (err) => {
          this.codeCompletionEnabled = false;
        });
    }
    catch (err) {
      this.codeCompletionEnabled = false;
    }
  }

  loadExamples() {
    this.examplesDropdownOptions = this.documentsList.getDocumentListOptions();
  }

  changeExampleDoc(event) {
    this.showExample = false;
    let selectedDoc = event.option.key.split(":");

    this.exampleCat = selectedDoc[0];
    this.exampleDoc = selectedDoc[1];
    this.showExample = true;
  }

  createLanguageClient(connection: MessageConnection): MonacoLanguageClient {
    return new MonacoLanguageClient({
      name: "AppLens Language Client",
      clientOptions: {
        // use a language id as a document selector
        documentSelector: ['csharp'],
        // disable the default error handler
        errorHandler: {
          error: () => ErrorAction.Continue,
          closed: () => CloseAction.DoNotRestart
        }
      },
      // create a language client connection from the JSON RPC connection on demand
      connectionProvider: {
        get: (errorHandler, closeHandler) => {
          return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
        }
      }
    });
  }

  createWebSocket(url: string): WebSocket {
    const socketOptions = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 10000,
      maxRetries: 3,
      debug: false
    };

    return new WebSocket(url);

    // TODO :: Check with Ajay if this can work
    //return new ReconnectingWebSocket(url, undefined, socketOptions);
  }

  // ngOnChanges() {
  //   if (this.initialized) {
  //     this.initialize();
  //   }
  // }

  gistVersionChange() {
    var newGist;
    this.updateGistVersionOptions(this.pastGistEvent);
    // updating the gistVersionOptions to tag with [in use] the new gist version being used and untag the previous one
    this.gistVersionOptions.forEach(element => {
      element.key === this.selectedKey ? element.text = `${element.text} [in use]` : element.key === this.configuration['dependencies'][this.gistName] ? element.text = element.text.split(' [', 1)[0] : element.text = element.text;
    });
    Object.keys(this.temporarySelection).forEach(id => {
      if (this.temporarySelection[id]['version'] !== this.configuration['dependencies'][id]) {
        this.configuration['dependencies'][id] = this.temporarySelection[id]['version'];
        this.reference[id] = this.temporarySelection[id]['code'];
        this.showGistCode = false;
      }
    });

    this.gistDialogHidden = true;
  }

  openCommitHistory() {
    window.open(this.commitHistoryLink);
  }

  showUpdateDetectorReferencesDialog() {
    this.detectorReferencesDialogHidden = false;
    this._telemetryService.logEvent(TelemetryEventNames.SuperGistUpdateDetectorReferencesButtonClicked, {
      ResourceID: this.resourceId,
      ID: this.id,
    });
  }

  dismissDetectorRefDialog() {
    this.detectorReferencesDialogHidden = true;
  }

  updateGistVersionOptions(event: string) {
    this.loadingGistVersions = true;
    this.pastGistEvent = event;
    this.gistName = event["option"].text;
    this.selectedKey = this.gistVersionChanged === false ? this.configuration['dependencies'][this.gistName] : this.pastGistVersionEvent["option"]["key"];
    this.gistVersionOptions = [];
    this.latestGistVersion = "";
    var tempList: IDropdownProps['options'] = [];
    if (!this.detectorGraduation) {
      this.githubService.getChangelist(this.gistName)
        .subscribe((version: Commit[]) => {
          version.forEach((v, index) => tempList.push({
            key: String(`${v["sha"]}`),
            text: String(`${v["author"]}: ${v["dateTime"]} ${v["sha"] === this.configuration['dependencies'][this.gistName] ? "[in use]" : ""}`),
            title: String(`${this.gistName}`),
            selected: index === 1
          }));
          this.gistVersionOptions = tempList.reverse();
          this.refreshGistButtonDisabled = false;
          this.displayGistSourceCode(this.gistName, this.selectedKey);
          this.loadingGistVersions = false;
        });
    }
    else {
      this.diagnosticApiService.getDevopsChangeList(`${this.DevopsConfig.folderPath}/${this.gistName}/${this.gistName}.csx`, this.resourceId).subscribe((data: any[]) => {
        data.forEach(version => {
          let commitDate = version["author"]["date"];
          let commitDateFormatted = moment(commitDate).format('MM/DD/YYYY HH:mm:ss');
          let authorAlias = version["author"]['email'].split("@")[0];
          let displayText = String(`${authorAlias}: ${commitDateFormatted} ${version["commitId"] === this.configuration['dependencies'][this.gistName] ? "[in use]" : ""}`);
          tempList.push({
            key: String(`${version["commitId"]}`),
            text: displayText,
            title: String(`${this.gistName}`)
          })
        });
      });
      this.loadingGistVersions = false;
      this.refreshGistButtonDisabled = false;
      this.gistVersionOptions = tempList.reverse();
      if (this.gistVersionOptions.length > 10) {
        this.gistVersionOptions = this.gistVersionOptions.slice(0, 10);
      }
    }
  }

  showGistCode: boolean = false;
  displayGistCode = "";

  gistDropdownWidth: IDropdownProps['styles'] = {
    root: {
      width: '200px'
    },
    dropdownItemsWrapper: {
      maxHeight: '40vh'
    },

  };

  gistVersionOnChange(event: string) {
    this.gistVersionChanged = true;
    this.applyGistButtonDisabled = this.selectedKey !== event["option"]["key"] ? false : true;
    this.pastGistVersionEvent = event;
    this.temporarySelection[event["option"]["title"]]['version'] = event["option"]["key"];
    if (this.detectorGraduation) {
      this.diagnosticApiService.getDevopsCommitContent(`${this.DevopsConfig.folderPath}/${event["option"]["title"]}/${event["option"]["title"]}.csx`, this.temporarySelection[event["option"]["title"]]['version'], this.resourceId).subscribe(x => {
        this.temporarySelection[event["option"]["title"]]['code'] = x;
        this.showGistCode = true;
        this.displayGistCode = x;
      })
    } else {
      this.displayGistSourceCode(event["option"]["title"], this.temporarySelection[event["option"]["title"]]['version']);
    }

  }

  displayGistSourceCode(gistName: string, gistVersion: string) {
    this.githubService.getCommitContent(gistName, gistVersion).subscribe(x => {
      this.temporarySelection[gistName]['code'] = x;
      this.showGistCode = true;
      this.displayGistCode = x;
    });
  }

  disableRunButton() {
    this.runButtonDisabled = true;
    this.runButtonStyle = {
      root: {
        cursor: "not-allowed",
        color: "grey"
      }
    };
    this.runIcon = {
      iconName: 'Play',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
  }

  disablePublishButton() {
    this.publishButtonDisabled = true;
    this.publishButtonStyle = {
      root: {
        cursor: "not-allowed",
        color: "grey"
      }
    };
    this.publishIcon = {
      iconName: 'Upload',
      styles: {
        root: { color: "grey" }
      }
    };
  }

  enableRunButton() {
    this.runButtonDisabled = false;
    this.runButtonStyle = {
      root: { cursor: "default" }
    };
    this.runIcon = { iconName: 'Play' };
  }

  enablePublishButton() {
    this.publishButtonDisabled = false;
    this.publishButtonStyle = {
      root: { cursor: "default" }
    };
    this.publishIcon = { iconName: 'Upload' };
  }

  showGistDialog() {
    this._copilotContainerService.hideCopilotPanel();
    this.gistsDropdownOptions = [];
    this.gists = Object.keys(this.configuration['dependencies']);
    this.gists.forEach(g => {
      this.gistsDropdownOptions.push({
        key: String(g),
        text: String(g)
      });
    });
    if (this.gists.length == 0) {
      this.gistUpdateTitle = "No gists available";
    }
    else {
      this.gistUpdateTitle = "Update Gist version"
    }
    this.gistDialogHidden = false;
    this.gists.forEach(g => this.temporarySelection[g] = { version: this.configuration['dependencies'][g], code: '' });
  }
  dismissGistDialog() {
    this.gistDialogHidden = true;
  }

  isCompilationTraceClickable(item: CompilationTraceOutputDetails): boolean {
    return (!!item.location &&
      item.location.start.linePos > -1 && item.location.start.colPos > -1 && item.location.end.linePos > -1 && item.location.end.colPos > -1 &&
      (item.location.start.linePos > 0 || item.location.start.colPos > 0 || item.location.end.linePos > 0 || item.location.end.colPos > 0)
    )
  }

  markCodeLinesInEditor(compilerTraces: CompilationTraceOutputDetails[]) {
    if (!!this._monacoEditor) {
      if (compilerTraces == null) {
        //Clear off all code decorations/underlines
        this._oldCodeDecorations = this._monacoEditor.deltaDecorations(this._oldCodeDecorations, []);
      }
      else {
        let newDecorations = [];
        compilerTraces.forEach(traceEntry => {
          if (this.isCompilationTraceClickable(traceEntry)) {
            let underLineColor = '';
            if (traceEntry.severity == HealthStatus.Critical) underLineColor = 'codeUnderlineError';
            if (traceEntry.severity == HealthStatus.Warning) underLineColor = 'codeUnderlineWarning';
            if (traceEntry.severity == HealthStatus.Info) underLineColor = 'codeUnderlineInfo';
            if (traceEntry.severity == HealthStatus.Success) underLineColor = 'codeUnderlineSuccess';

            newDecorations.push({
              range: new monaco.Range(traceEntry.location.start.linePos + 1, traceEntry.location.start.colPos + 1, traceEntry.location.end.linePos + 1, traceEntry.location.end.colPos + 1),
              options: {
                isWholeLine: false,
                inlineClassName: `codeUnderline ${underLineColor}`,
                hoverMessage: [{
                  value: traceEntry.message,
                  isTrusted: true,
                } as monaco.IMarkdownString]
              }
            } as monaco.editor.IModelDeltaDecoration);
          }
        });
        if (newDecorations.length > 0) {
          this._oldCodeDecorations = this._monacoEditor.deltaDecorations(this._oldCodeDecorations, newDecorations);
        }
      }
    }
  }

  navigateToEditorIfApplicable(item: CompilationTraceOutputDetails) {
    if (this.isCompilationTraceClickable(item) && !!this._monacoEditor) {
      this._monacoEditor.revealRangeInCenterIfOutsideViewport({
        startLineNumber: item.location.start.linePos + 1,
        startColumn: item.location.start.colPos + 1,
        endLineNumber: item.location.end.linePos + 1,
        endColumn: item.location.end.colPos + 1
      }, 1);

      this._monacoEditor.setPosition({
        lineNumber: item.location.start.linePos + 1,
        column: item.location.start.colPos + 1
      });
      this._monacoEditor.focus();
    }
  }

  getfaIconClass(item: CompilationTraceOutputDetails): string {
    if (item.severity == HealthStatus.Critical) return 'fa-exclamation-circle critical-color';
    if (item.severity == HealthStatus.Warning) return 'fa-exclamation-triangle warning-color';
    if (item.severity == HealthStatus.Info) return 'fa-info-circle info-color';
    if (item.severity == HealthStatus.Success) return 'fa-check-circle success-color';
    return '';
  }

  confirmGistChanges() {
    Object.keys(this.temporarySelection).forEach(id => {
      if (this.temporarySelection[id]['version'] !== this.configuration['dependencies'][id]) {
        this.configuration['dependencies'][id] = this.temporarySelection[id]['version'];
        this.reference[id] = this.temporarySelection[id]['code'];
      }
    });

    this.ngxSmartModalService.getModal('packageModal').close();
  }

  cancel() {
    this.selectedGist = '';
    this.temporarySelection = {};
    this.ngxSmartModalService.getModal('packageModal').close();
  }

  managePackage() {
    this.gists = Object.keys(this.configuration['dependencies']);
    this.selectedGist = '';
    this.temporarySelection = {};

    this.gists.forEach(g => this.temporarySelection[g] = { version: this.configuration['dependencies'][g], code: '' });

    this.ngxSmartModalService.getModal('packageModal').open();
  }

  saveProgress() {
    localStorage.setItem(`${this.id.toLowerCase()}_code`, this.code);
  }

  retrieveProgress() {
    let savedCode: string = localStorage.getItem(`${this.id.toLowerCase()}_code`)
    if (savedCode) {
      this.code = savedCode;
      this.lastSavedVersion = this.code
    }
  }

  deleteProgress() {
    localStorage.removeItem(`${this.id.toLowerCase()}_code`);
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  getDevOptions() {
    this.ngxSmartModalService.getModal('devModeModal').open();
  }

  dismissDevModal() {
    // Set the default popped up behaviour of local development modal as a key value pair in localStorage
    localStorage.setItem("localdevmodal.hidden", this.hideModal === true ? "true" : "false");
    this.ngxSmartModalService.getModal('devModeModal').close();
  }

  downloadLocalDevTools() {
    this.localDevButtonDisabled = true;
    this.localDevText = "Preparing Local Tools";
    this.localDevIcon = "fa fa-circle-o-notch fa-spin";

    var body = {
      script: this.code,
      configuration: this.configuration,
      gists: this.allGists,
      baseUrl: window.location.origin
    };

    localStorage.setItem("localdevmodal.hidden", this.hideModal === true ? "true" : "false");

    this.diagnosticApiService.prepareLocalDevelopment(body, this.id.toLowerCase(), this._detectorControlService.startTimeString,
      this._detectorControlService.endTimeString, this.dataSource, this.timeRange)
      .subscribe((response: string) => {
        this.localDevButtonDisabled = false;
        this.localDevUrl = response;
        this.localDevText = "Download Local Development Package";
        this.localDevIcon = "fa fa-download";

        var element = document.createElement('a');
        element.setAttribute('href', response);
        element.setAttribute('download', "Local Development Package");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      }, ((error: any) => {
        this.localDevButtonDisabled = false;
        this.publishingPackage = null;
        this.localDevText = "Something went wrong";
        this.localDevIcon = "fa fa-download";
      }));
  }

  serializeQueryParams(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }

  runCompilation() {
    if (this.isWorkflowDetector) {
      this.runWorkflowCompilation();
    } else {
      this.runDetectorCompilation();
    }

    this._copilotContainerService.hideCopilotPanel();
  }

  runWorkflowCompilation() {
    if (this.runButtonDisabled) {
      return;
    }

    this.workflowPublishBody = this.createWorkflow.getWorkflowPublishBody();
    if (this.workflowPublishBody == null) {
      this.disableSaveButton();
      return;
    }

    this.enableSaveButton();
    this.workflowId = this.getDetectorId();

    const dialogConfig = this.getNewMatDialogConfig();
    dialogConfig.data = {
      workflowId: this.workflowId,
      workflowPublishBody: this.workflowPublishBody
    };

    this.matDialog.open(WorkflowRunDialogComponent, dialogConfig).afterClosed().subscribe(modelData => {
      if (modelData != null) {
        if (modelData.workflowSucceeded === true) {
          this.workflowPackage = modelData.workflowPackage;
          this.code = this.workflowPackage.codeString;
          this.useAutoMergeText = this.DevopsConfig.autoMerge || (this.DevopsConfig.internalPassthrough && !this.IsDetectorMarkedPublic(this.code) && !this.IsDetectorMarkedPublic(this.originalCode));
          this.modalPublishingButtonText = !this.useAutoMergeText ? "Create PR" : "Publish";
          this.enablePublishButton();
        }
      } else {
        this.disableSaveButton();
      }
    });
  }

  runDetectorCompilation() {
    if (this.runButtonDisabled) {
      return;
    }
    this._queryResponseService.clearQueryResponse();
    this.buildOutput = [];
    this.buildOutput.push("------ Build started ------");
    this.detailedCompilationTraces = [];
    this.detailedCompilationTraces.push({
      severity: HealthStatus.None,
      message: '------ Build started ------',
      location: {
        start: {
          linePos: 0,
          colPos: 0
        } as Position,
        end: {
          linePos: 0,
          colPos: 0
        } as Position
      } as LocationSpan
    } as CompilationTraceOutputDetails);
    let currentCode = this.code;
    this.markCodeLinesInEditor(null);
    var body = {
      script: this.code,
      references: this.reference,
      entityType: this.gistMode ? 'gist' : 'signal',
      detectorUtterances: JSON.stringify(this.allUtterances.map(x => x.text))
    };

    this.disableRunButton();
    this.disablePublishButton();
    this.localDevButtonDisabled = true;
    this.runButtonText = "Running";
    this.runButtonIcon = "fa fa-circle-o-notch fa-spin";

    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

    this._activatedRoute.queryParams.subscribe((params: Params) => {
      let queryParams = JSON.parse(JSON.stringify(params));
      queryParams.startTime = undefined;
      queryParams.endTime = undefined;
      let serializedParams = this.serializeQueryParams(queryParams);
      if (serializedParams && serializedParams.length > 0) {
        serializedParams = "&" + serializedParams;
      };
      this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, this.id.toLowerCase(), this._detectorControlService.startTimeString,
        this._detectorControlService.endTimeString, this.dataSource, this.timeRange, {
        scriptETag: this.compilationPackage.scriptETag,
        assemblyName: this.compilationPackage.assemblyName,
        formQueryParams: serializedParams,
        getFullResponse: true
      }, this.getDetectorId())
        .subscribe((response: any) => {
          this._queryResponseService.addQueryResponse(response.body)
          if (this.queryResponse.invocationOutput && this.queryResponse.invocationOutput.metadata && this.queryResponse.invocationOutput.metadata.id && !isSystemInvoker) {
            this.id = this.queryResponse.invocationOutput.metadata.id;
            let dataset = this.queryResponse.invocationOutput.dataset;
            this.isShieldEmbedded = dataset && dataset.findIndex(x => x.renderingProperties && (x.renderingProperties.type == RenderingType.SearchComponent)) >= 0 ? true : false;
          }
          if (this.queryResponse.invocationOutput.suggestedUtterances && this.queryResponse.invocationOutput.suggestedUtterances.results) {
            this.recommendedUtterances = this.queryResponse.invocationOutput.suggestedUtterances.results;
            this._telemetryService.logEvent("SuggestedUtterances", { detectorId: this.queryResponse.invocationOutput.metadata.id, detectorDescription: this.queryResponse.invocationOutput.metadata.description, numUtterances: this.allUtterances.length.toString(), numSuggestedUtterances: this.recommendedUtterances.length.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
          }
          else {
            this._telemetryService.logEvent("SuggestedUtterancesNull", { detectorId: this.queryResponse.invocationOutput.metadata.id, detectorDescription: this.queryResponse.invocationOutput.metadata.description, numUtterances: this.allUtterances.length.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
          }
          this.enableRunButton();
          this.runButtonText = "Run";
          this.runButtonIcon = "fa fa-play";
          if (this.queryResponse.compilationOutput.compilationTraces) {
            this.queryResponse.compilationOutput.compilationTraces.forEach(element => {
              this.buildOutput.push(element);
            });
          }
          if (this.queryResponse.compilationOutput.detailedCompilationTraces) {
            this.showDetailedCompilationTraces = true;
            this.queryResponse.compilationOutput.detailedCompilationTraces.forEach(traceElement => {
              this.detailedCompilationTraces.push(traceElement);
            });
          }
          else {
            this.showDetailedCompilationTraces = false;
          }
          // If the script etag returned by the server does not match the previous script-etag, update the values in memory
          if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
            this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
            this.compilationPackage.assemblyName = this.queryResponse.compilationOutput.assemblyName;
            this.compilationPackage.assemblyBytes = this.queryResponse.compilationOutput.assemblyBytes;
            this.compilationPackage.pdbBytes = this.queryResponse.compilationOutput.pdbBytes;
          }

          if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
            this.publishButtonDisabled = false;
            this.preparePublishingPackage(this.queryResponse, currentCode);
            this.buildOutput.push("========== Build: 1 succeeded, 0 failed ==========");
            this.detailedCompilationTraces.push({
              severity: HealthStatus.None,
              message: '========== Build: 1 succeeded, 0 failed ==========',
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                } as Position,
                end: {
                  linePos: 0,
                  colPos: 0
                } as Position
              } as LocationSpan
            } as CompilationTraceOutputDetails);
          } else {
            this.publishButtonDisabled = true;
            this.publishingPackage = null;
            this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
            this.detailedCompilationTraces.push({
              severity: HealthStatus.None,
              message: '========== Build: 0 succeeded, 1 failed ==========',
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                } as Position,
                end: {
                  linePos: 0,
                  colPos: 0
                } as Position
              } as LocationSpan
            } as CompilationTraceOutputDetails);
          }

          if (this.queryResponse.runtimeLogOutput) {
            this.queryResponse.runtimeLogOutput.forEach(element => {
              if (element.exception) {
                this.buildOutput.push(element.timeStamp + ": " +
                  element.message + ": " +
                  element.exception.ClassName + ": " +
                  element.exception.Message + "\r\n" +
                  element.exception.StackTraceString);

                this.detailedCompilationTraces.push({
                  severity: HealthStatus.Critical,
                  message: `${element.timeStamp}: ${element.message}: ${element.exception.ClassName}: ${element.exception.Message}: ${element.exception.StackTraceString}`,
                  location: {
                    start: {
                      linePos: 0,
                      colPos: 0
                    },
                    end: {
                      linePos: 0,
                      colPos: 0
                    }
                  }
                });
              }
              else {
                this.buildOutput.push(element.timeStamp + ": " + element.message);
                this.detailedCompilationTraces.push({
                  severity: HealthStatus.Info,
                  message: `${element.timeStamp}: ${element.message}`,
                  location: {
                    start: {
                      linePos: 0,
                      colPos: 0
                    },
                    end: {
                      linePos: 0,
                      colPos: 0
                    }
                  }
                });
              }
            });
          }

          if ((
            !this.gistMode && this.queryResponse.runtimeSucceeded != null && !this.queryResponse.runtimeSucceeded
          ) || (
              this.gistMode && this.queryResponse.compilationOutput != null &&
              !this.queryResponse.compilationOutput.compilationSucceeded
            )) {
            this.disablePublishButton();
          }
          else {
            this.useAutoMergeText = this.DevopsConfig.autoMerge || (this.DevopsConfig.internalPassthrough && !this.IsDetectorMarkedPublic(this.code) && !this.IsDetectorMarkedPublic(this.originalCode));
            this.modalPublishingButtonText = !this.useAutoMergeText ? "Create PR" : "Publish";
            this.enablePublishButton();
          }

          this.localDevButtonDisabled = false;
          this.markCodeLinesInEditor(this.detailedCompilationTraces);
        }, ((error: any) => {
          let errorObj = JSON.parse(error.error);
          const errorMessage = (error.status === 403 && errorObj.Status === UserAccessStatus.AllowedResourceException) ? "" : error?.error?.replace(/"/g, '');
          this.enableRunButton();
          this.publishingPackage = null;
          this.localDevButtonDisabled = false;
          this.runButtonText = "Run";
          this.runButtonIcon = "fa fa-play";
          this.buildOutput.push(errorMessage?.length > 0 ? errorMessage : "Something went wrong during detector invocation.");
          this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
          this.detailedCompilationTraces.push({
            severity: HealthStatus.Critical,
            message: `${errorMessage?.length > 0 ? errorMessage : "Something went wrong during detector invocation."}`,
            location: {
              start: {
                linePos: 0,
                colPos: 0
              },
              end: {
                linePos: 0,
                colPos: 0
              }
            }
          });
          this.detailedCompilationTraces.push({
            severity: HealthStatus.None,
            message: '========== Build: 0 succeeded, 1 failed ==========',
            location: {
              start: {
                linePos: 0,
                colPos: 0
              },
              end: {
                linePos: 0,
                colPos: 0
              }
            }
          });
          if (error.status === 403 && errorObj.Status === UserAccessStatus.AllowedResourceException)  {
            var url = errorObj.DetailText;
            this.detailedCompilationTraces.push({
              severity: HealthStatus.Critical,
              message: `Visit this website to verify your access to the requested subscription: <a href= ${url} target=_blank> ${url} </a>`,
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                },
                end: {
                  linePos: 0,
                  colPos: 0
                }
              }
            });
          }
          this.markCodeLinesInEditor(this.detailedCompilationTraces);
        }));
    });
  }

  getDetectorId(): string {
    if (this.mode === DevelopMode.Edit) {
      return this.id.toLowerCase();
    } else if (this.mode === DevelopMode.Create) {
      return newDetectorId;
    }
  }

  checkAccessAndConfirmPublish() {

    var isOriginalCodeMarkedPublic: boolean = this.IsDetectorMarkedPublic(this.originalCode);
    this.diagnosticApiService.verfifyPublishingDetectorAccess(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`, this.publishingPackage.codeString, isOriginalCodeMarkedPublic).subscribe(data => {

      this.publishAccessControlResponse = data;
      if (data.hasAccess === false) {
        this.ngxSmartModalService.getModal('publishAccessDeniedModal').open();
      }
      else {
        if (!this.publishButtonDisabled) {
          this.ngxSmartModalService.getModal('publishModal').open();
        }
      }

    }, err => {
      this._telemetryService.logEvent("ErrorValidatingPublishingAccess", { error: JSON.stringify(err) });
      this.ngxSmartModalService.getModal('publishModal').open();
    });
  }

  prepareMetadata() {
    this.publishingPackage.metadata = JSON.stringify({ "utterances": this.allUtterances, "shieldEmbedded": this.isShieldEmbedded });
  }

  setBranch() {
    this.Branch;
  }

  targetInShowBranches(target) {
    var match;
    this.showBranches.forEach(x => {
      if (x.key === target) {
        match = true;
      }
    });
    return match;
  }

  setTargetBranch(tempId = null) {

    var targetBranch = "";

    if (tempId === null) {
      targetBranch = this.gistMode ? `dev/${this.userName.split("@")[0]}/gist/${this.id.toLowerCase()}` : `dev/${this.userName.split("@")[0]}/detector/${this.id.toLowerCase()}`;
    }
    else {
      targetBranch = this.gistMode ? `dev/${this.userName.split("@")[0]}/gist/${tempId.toLowerCase()}` : `dev/${this.userName.split("@")[0]}/detector/${tempId.toLowerCase()}`;
    }

    if (this.isWorkflowDetector) {
      let publishBody = this.createWorkflow.getWorkflowPublishBody();
      targetBranch = `dev/${this.userName.split("@")[0]}/workflow/${publishBody.Id}`;
    }

    if (this.Branch === this.defaultBranch && this.targetInShowBranches(targetBranch)) {
      this.Branch = targetBranch.replace(/\s/g, "");
      this.displayBranch = `${targetBranch.replace(/\s/g, "")}`;
    }
    else if (!(this.showBranches.length > 1) || this.Branch === this.defaultBranch || this.mode === DevelopMode.Create) {
      this.displayBranch = `${targetBranch.replace(/\s/g, "")} (not published)`;
      this.Branch = targetBranch.replace(/\s/g, "");
    }
  }

  showPublishDialog() {
    if (this.publishButtonDisabled) {
      return;
    }

    this.setTargetBranch();

    if (this.isWorkflowDetector) {
      let publishBody = this.createWorkflow.getWorkflowPublishBody();
      if (this.mode == DevelopMode.Create && !this.isSaved) {
        this.PRTitle = `Creating ${publishBody.Id}`;
      }
      else {
        this.PRTitle = `Changes to ${publishBody.Id}`;
      }
    } else {
      if (this.mode == DevelopMode.Create && !this.isSaved) {
        this.PRTitle = `Creating ${this.id}`;
      }
      else {
        this.PRTitle = `Changes to ${this.id}`;
      }
    }
    this.publishDialogHidden = false;
  }

  publishDialogCancel() {
    this.publishDialogHidden = true;
  }

  toggleOpenState() {

  }

  dismissDialog() {

  }

  onOpenPublishSuccessPanel() {
    this.currentTime = moment(Date.now()).format("hh:mm A");
    this.submittedPanelTimer = setTimeout(() => {
      this.dismissPublishSuccessHandler();
    }, 10000);
  }

  dismissPublishSuccessHandler() {
    this.publishSuccess = false;
    this.publishFailed = false;
    this.saveSuccess = false;
    this.saveFailed = false;
    this.saveIdFailure = false;
    this.badBranchNameFailure = false;
    this.deleteSuccess = false;
    this.deleteFailed = false;
  }



  publish() {
    if (this.publishButtonDisabled) {
      return;
    }

    this.updatePublishingPackageIfWorkflow();

    if (!this.publishingPackage ||
      this.publishingPackage.codeString === '' ||
      this.publishingPackage.id === '' ||
      this.publishingPackage.dllBytes === '') {
      return;
    }

    this.prepareMetadata();
    this.disableRunButton();
    this.disablePublishButton();
    this.modalPublishingButtonDisabled = true;
    this.modalPublishingButtonText = this.detectorGraduation && !this.useAutoMergeText ? "Sending PR" : "Publishing";
    var isOriginalCodeMarkedPublic: boolean = this.IsDetectorMarkedPublic(this.originalCode);

    if (this.detectorGraduation) {
      this.gradPublish();
    }
    else {
      this.diagnosticApiService.publishDetector(this.emailRecipients, this.publishingPackage, `${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`, isOriginalCodeMarkedPublic).subscribe(data => {
        this.originalCode = this.publishingPackage.codeString;
        this.deleteProgress();
        this.utteranceInput = "";
        this.enableRunButton();
        this.localDevButtonDisabled = false;
        this.enablePublishButton();
        this.modalPublishingButtonText = this.detectorGraduation && !this.useAutoMergeText ? "Create PR" : "Publish";
        this.ngxSmartModalService.getModal('publishModal').close();
        this.detectorName = this.publishingPackage.id;
        this.publishSuccess = true;
        this._telemetryService.logEvent("SearchTermPublish", { detectorId: this.id.toLowerCase(), numUtterances: this.allUtterances.length.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
      }, err => {
        this.enableRunButton();
        this.localDevButtonDisabled = false;
        this.enablePublishButton();
        this.modalPublishingButtonText = this.detectorGraduation && !this.useAutoMergeText ? "Create PR" : "Publish";
        this.ngxSmartModalService.getModal('publishModal').close();
        this.showAlertBox('alert-danger', 'Publishing failed. Please try again after some time.');
        this.publishFailed = true;
      });
    }
  }

  addReviewers() {
    let reviewers = "";
    if (!!this.queryResponse) {
      if (!!this.queryResponse.invocationOutput['appFilter']) {
        if (!!this.queryResponse.invocationOutput['appFilter']['AppType']) {
          this.queryResponse.invocationOutput['appFilter']['AppType'].split(',').forEach(apt => {
            if (Object.keys(this.DevopsConfig.appTypeReviewers).includes(apt)) {
              this.DevopsConfig.appTypeReviewers[apt].forEach(rev => {
                if (!this.owners.includes(rev)) this.owners.push(rev);
              });
            }
          });
        }
        if (!!this.queryResponse.invocationOutput['appFilter']['PlatformType']) {
          this.queryResponse.invocationOutput['appFilter']['PlatformType'].split(',').forEach(plt => {
            if (Object.keys(this.DevopsConfig.platformReviewers).includes(plt)) {
              this.DevopsConfig.platformReviewers[plt].forEach(rev => {
                if (!this.owners.includes(rev)) this.owners.push(rev);
              });
            }
          });
        }
      }
      this.owners.forEach(o => {
        if (o.match(/^\s*$/) == null) reviewers = reviewers.concat(o, '\n');
      });
    } else {
      if (this.isWorkflowDetector && this.workflowPublishBody != null) {
        if (this.workflowPublishBody.AppType != null) {
          this.workflowPublishBody.AppType.split(',').forEach(apt => {
            if (Object.keys(this.DevopsConfig.appTypeReviewers).includes(apt)) {
              this.DevopsConfig.appTypeReviewers[apt].forEach(rev => {
                if (!this.owners.includes(rev)) this.owners.push(rev);
              });
            }
          });
        }
        if (this.workflowPublishBody.Platform != null) {
          this.workflowPublishBody.Platform.split(',').forEach(plt => {
            if (Object.keys(this.DevopsConfig.platformReviewers).includes(plt)) {
              this.DevopsConfig.platformReviewers[plt].forEach(rev => {
                if (!this.owners.includes(rev)) this.owners.push(rev);
              });
            }
          });
        }
        this.owners.forEach(o => {
          if (o.match(/^\s*$/) == null) reviewers = reviewers.concat(o, '\n');
        });
      }
    }

    return reviewers;
  }

  gradPublish() {
    this.publishDialogHidden = true;

    //var pushToMain = this.DevopsConfig.autoMerge || (this.DevopsConfig.internalPassthrough && this.queryResponse.invocationOutput['appFilter']['InternalOnly'] === 'True' && !this.IsDetectorMarkedPublic(this.originalCode));

    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

    const commitType = (this.mode == DevelopMode.Create && !this.isSaved || (this.useAutoMergeText && !this.codeOnDefaultBranch) && !isSystemInvoker) ? "add" : "edit";
    const commitMessageStart = (this.mode == DevelopMode.Create && !this.isSaved || (this.useAutoMergeText && !this.codeOnDefaultBranch) && !isSystemInvoker) ? "Adding" : "Editing";

    this.lastSavedId = commitType == "add" ? this.publishingPackage.id : this.lastSavedId;

    let gradPublishFiles: string[] = [
      this.publishingPackage.codeString,
      this.publishingPackage.metadata,
      this.publishingPackage.packageConfig
    ];


    let gradPublishFileTitles: string[] = [
      `/${this.publishingPackage.id.toLowerCase()}/${this.publishingPackage.id.toLowerCase()}.csx`,
      `/${this.publishingPackage.id.toLowerCase()}/metadata.json`,
      `/${this.publishingPackage.id.toLowerCase()}/package.json`
    ];

    if (this.isWorkflowDetector) {
      gradPublishFileTitles.push(`/${this.publishingPackage.id.toLowerCase()}/workflow.json`);
      gradPublishFiles.push(this.publishingPackage.workflowJson);
    }

    let reviewers = "";

    if (Object.keys(this.DevopsConfig.appTypeReviewers).length > 0 || Object.keys(this.DevopsConfig.platformReviewers).length > 0) {
      reviewers = this.addReviewers();
      gradPublishFileTitles.push(`/${this.publishingPackage.id.toLowerCase()}/owners.txt`);
      gradPublishFiles.push(reviewers);
    }

    var requestBranch = isSystemInvoker ? `dev/${this.userName.split("@")[0]}/detector/${this.publishingPackage.id.toLowerCase()}` : this.Branch;
    if (this.useAutoMergeText && !isSystemInvoker) {
      requestBranch = this.defaultBranch;
      this.useAutoMergeText = true;
    }

    let link = this.gistMode ? `${this.PPEHostname}/${this.resourceId}/gists/${this.publishingPackage.id}?branchInput=${this.Branch}` : `${this.PPEHostname}/${this.resourceId}/detectors/${this.publishingPackage.id}/edit?branchInput=${this.Branch}`;
    if (this.isWorkflowDetector) {
      link = `${this.PPEHostname}/${this.resourceId}/workflows/${this.publishingPackage.id}/edit?branchInput=${this.Branch}`;
    }

    let description = `This Pull Request was created via AppLens. To make edits, go to ${link}`;
    const DetectorObservable = isSystemInvoker ? this.diagnosticApiService.pushDetectorChanges(requestBranch, gradPublishFiles, gradPublishFileTitles, `${commitMessageStart} ${this.publishingPackage.id} Author : ${this.userName}`, commitType, this.SYSTEM_INVOKER_RESOURCE_ID) : this.diagnosticApiService.pushDetectorChanges(requestBranch, gradPublishFiles, gradPublishFileTitles, `${commitMessageStart} ${this.publishingPackage.id} Author : ${this.userName}`, commitType, this.resourceId);
    const makePullRequestObservable = isSystemInvoker ? this.diagnosticApiService.makePullRequest(requestBranch, this.SYSTEM_INVOKER_MAIN_BRANCH, this.PRTitle, this.SYSTEM_INVOKER_RESOURCE_ID, this.owners, description) : this.diagnosticApiService.makePullRequest(requestBranch, this.defaultBranch, this.PRTitle, this.resourceId, this.owners, description);

    DetectorObservable.subscribe(_ => {
      if (!this.useAutoMergeText || isSystemInvoker) {
        makePullRequestObservable.subscribe(_ => {
          this.PRLink = `${_["webUrl"]}/pullrequest/${_["prId"]}`
          this.publishSuccess = true;
          this.lastSavedVersion = this.publishingPackage.codeString;
          this.postPublish();
          //this._applensCommandBarService.refreshPage();
        }, err => {
          this.publishFailed = true;
          this.postPublish();
        });
      }
      else {
        this.PRLink = (this.DevopsConfig.folderPath === "/") ? `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}${this.publishingPackage.id.toLowerCase()}/${this.publishingPackage.id.toLowerCase()}.csx&version=GB${this.Branch}` : `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}/${this.publishingPackage.id.toLowerCase()}/${this.publishingPackage.id.toLowerCase()}.csx&version=GB${this.defaultBranch}`;
        this.publishSuccess = true;
        this.lastSavedVersion = this.publishingPackage.codeString;
        this.postPublish();
        this.codeOnDefaultBranch = true;
        this.deleteBranch(this.Branch, this.resourceId);
        //this._applensCommandBarService.refreshPage();
      }
    }, err => {
      if (err.error.includes("Branch name cannot contain the following characters:")) {
        this.charWarningMessage = err.error;
        this.badBranchNameFailure = true;
      }
      this.charWarningMessage = err.error;
      this.publishFailed = true;
      this.postPublish();
    });


  }

  deleteDetector() {
    this.detectorDeleted = true;
    this.deletingDetector = true;

    this.useAutoMergeText = this.DevopsConfig.autoMerge || (this.DevopsConfig.internalPassthrough && !this.IsDetectorMarkedPublic(this.code) && !this.IsDetectorMarkedPublic(this.originalCode));

    let gradPublishFiles: string[] = [
      "delete code",
      "delete metadata",
      "delete package"
    ];


    let gradPublishFileTitles: string[] = [
      `/${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx`,
      `/${this.id.toLowerCase()}/metadata.json`,
      `/${this.id.toLowerCase()}/package.json`
    ];

    if (this.isWorkflowDetector) {
      gradPublishFiles.push("delete workflowjson");
      gradPublishFileTitles.push(`/${this.id.toLowerCase()}/workflow.json`);
    }

    if (Object.keys(this.DevopsConfig.appTypeReviewers).length > 0 || Object.keys(this.DevopsConfig.platformReviewers).length > 0) {
      gradPublishFiles.push("delete owners.txt");
      gradPublishFileTitles.push(`/${this.id.toLowerCase()}/owners.txt`);
    }

    var requestBranch = this.Branch;
    if (this.useAutoMergeText) {
      requestBranch = this.defaultBranch;
    }

    const deleteDetectorFiles = this.diagnosticApiService.pushDetectorChanges(requestBranch, gradPublishFiles, gradPublishFileTitles, `deleting detector: ${this.id} Author : ${this.userName}`, "delete", this.resourceId);
    const makePullRequestObservable = this.diagnosticApiService.makePullRequest(requestBranch, this.defaultBranch, `Deleting ${this.id}`, this.resourceId, this.owners);
    deleteDetectorFiles.subscribe(_ => {
      if (!this.useAutoMergeText) {
        makePullRequestObservable.subscribe(_ => {
          this.PRLink = `${_["webUrl"]}/pullrequest/${_["prId"]}`
          this.deleteSuccess = true;
          this.postPublish();
        }, err => {
          this.deleteFailed = true;
          this.postPublish();
        });
      }
      else {
        this.PRLink = (this.DevopsConfig.folderPath === "/") ? `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx&version=GB${this.Branch}` : `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}/${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx&version=GB${this.defaultBranch}`;
        this.deleteSuccess = true;
        this.postPublish();
        this.deleteBranch(this.Branch, this.resourceId);
      }
    }, err => {
      this.deleteFailed = true;
      this.postPublish();
    });

    this.dismissDeleteDialog();
    this.deletingDetector = false
  }

  deleteBranch(branch: string, resourceId: string) {
    this.diagnosticApiService.deleteBranches(branch, resourceId).subscribe();
  }

  saveTempId: string = "";

  updatePublishingPackageIfWorkflow() {
    if (this.isWorkflowDetector) {
      this.publishingPackage = this.workflowPackage;
      this.code = this.publishingPackage.codeString;
      if (this.publishingPackage.metadata == null) {
        this.publishingPackage.metadata = "{}";
      }
      this.code = this.publishingPackage.codeString;
    }
  }

  saveDetectorCode() {
    this._copilotContainerService.hideCopilotPanel();
    this.updatePublishingPackageIfWorkflow();

    this.saveTempId = this.getIdFromCodeString();
    this.setTargetBranch(!!this.publishingPackage ? this.publishingPackage.id.toLowerCase() : this.saveTempId);
    this.publishDialogHidden = true;

    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

    const commitType = this.mode == DevelopMode.Create && !this.isSaved && !this.detectorLoaded ? "add" : "edit";
    const commitMessageStart = this.mode == DevelopMode.Create && !this.isSaved && !this.detectorLoaded ? "Adding" : "Editing";

    this.lastSavedId = commitType == "add" ? this.publishingPackage.id : this.lastSavedId;

    let gradPublishFiles: string[] = !!this.publishingPackage ? [
      this.code,
      this.publishingPackage.metadata,
      this.publishingPackage.packageConfig
    ] : [
      this.code,
      JSON.stringify({ "utterances": this.allUtterances, "shieldEmbedded" : this.isShieldEmbedded }),
      JSON.stringify(this.configuration)
    ];

    let idForSave = !!this.publishingPackage ? this.publishingPackage.id.toLowerCase() : this.saveTempId;
    if (this.mode == DevelopMode.Edit) idForSave = this.id;

    let gradPublishFileTitles: string[] = [
      `/${idForSave.toLowerCase()}/${idForSave.toLowerCase()}.csx`,
      `/${idForSave.toLowerCase()}/metadata.json`,
      `/${idForSave.toLowerCase()}/package.json`
    ];

    if (this.isWorkflowDetector) {
      gradPublishFileTitles.push(`/${idForSave.toLowerCase()}/workflow.json`);
      gradPublishFiles.push(this.publishingPackage.workflowJson);
    }

    let reviewers = "";

    if (Object.keys(this.DevopsConfig.appTypeReviewers).length > 0 || Object.keys(this.DevopsConfig.platformReviewers).length > 0) {
      reviewers = this.addReviewers();
      gradPublishFileTitles.push(`/${idForSave.toLowerCase()}/owners.txt`);
      gradPublishFiles.push(reviewers);
    }

    this.idMatches = idForSave == this.lastSavedId;
    const DetectorObservable = this.diagnosticApiService.pushDetectorChanges(this.Branch, gradPublishFiles, gradPublishFileTitles, `${commitMessageStart} ${idForSave} Author : ${this.userName}`, commitType, this.resourceId);

    this.saveButtonText = "Saving";
    this.publishDialogHidden = true;
    this.disableSaveButton();

    // successfully ran or edit mode
    if ((this.idMatches && !!this.publishingPackage) || this.mode == DevelopMode.Edit) {
      DetectorObservable.subscribe(_ => {
        this.PRLink = (this.DevopsConfig.folderPath === "/") ? `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}${idForSave.toLowerCase()}/${idForSave.toLowerCase()}.csx&version=GB${this.Branch}` : `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}/${idForSave.toLowerCase()}/${idForSave.toLowerCase()}.csx&version=GB${this.Branch}`;
        this.saveSuccess = true;
        this.lastSavedVersion = gradPublishFiles[0]
        this.postSave();
        this.lastSavedId = idForSave;
        this.isSaved = true;
        //this._applensCommandBarService.refreshPage();
      }, err => {
        if (err.error.includes('Detector with this ID already exists. Please use a new ID')) this.saveIdFailure = true;
        if (err.error.includes("Branch name cannot contain the following characters:")) {
          this.charWarningMessage = err.error;
          this.badBranchNameFailure = true;
        }
        this.saveFailed = true;
        this.postSave();
      });
    }
    else {
      this._diagnosticApi.idExists(this.saveTempId).subscribe(idExists => {
        if (!idExists || (this.detectorLoaded && this.idMatches)) {
          DetectorObservable.subscribe(_ => {
            this.PRLink = (this.DevopsConfig.folderPath === "/") ? `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}${idForSave.toLowerCase()}/${idForSave.toLowerCase()}.csx&version=GB${this.Branch}` : `https://dev.azure.com/${this.DevopsConfig.organization}/${this.DevopsConfig.project}/_git/${this.DevopsConfig.repository}?path=${this.DevopsConfig.folderPath}/${idForSave.toLowerCase()}/${idForSave.toLowerCase()}.csx&version=GB${this.Branch}`;
            this.saveSuccess = true;
            this.postSave();
            this.lastSavedId = idForSave;
            this.isSaved = true;
            //this._applensCommandBarService.refreshPage();
          }, err => {
            if (err.error.includes("Branch name cannot contain the following characters:")) {
              this.charWarningMessage = err.error;
              this.badBranchNameFailure = true;
            }
            this.saveFailed = true;
            this.postSave();
          });
        }
        else {
          this.saveIdFailure = idExists;
          this.saveFailed = true;
          this.postSave();
        }
      })
    }
  }

  postPublish() {
    this.modalPublishingButtonText = this.detectorGraduation && !this.useAutoMergeText ? "Create PR" : "Publish";
    this.getBranchList();
    this.enablePublishButton();
    this.enableRunButton();
  }

  idInSystem(detectorId: string): Observable<boolean> {
    return this._diagnosticApi.idExists(detectorId);
  }

  postSave() {
    this.saveButtonText = "Save";
    this.enableSaveButton();
  }

  saveIcon: any = { iconName: 'Save' };

  disableSaveButton() {
    this.saveButtonDisabled = true;
    this.saveIcon = {
      iconName: 'Save',
      styles: {
        root: { color: "grey" }
      }
    };
  }

  enableSaveButton() {
    this.saveButtonDisabled = false;
    this.saveIcon = { iconName: 'Save' };
  }


  isCallOutVisible: boolean = false;

  branchToggleCallout() {
    if (!this.branchButtonDisabled) {
      this.isCallOutVisible = !this.isCallOutVisible;
    }
  }

  toggleCallout() {
    this.isCallOutVisible = !this.isCallOutVisible;
  }

  closeCallout() {
    this.isCallOutVisible = false;
  }

  toggleTimeCallout() {
    this.openTimePickerCallout = !this.openTimePickerCallout;
  }

  closeTimeCallout() {
    this.openTimePickerCallout = false;
  }



  publishingAccessDeniedEmailOwners() {
    var toList: string = this.publishAccessControlResponse.resourceOwners.join("; ");
    var subject: string = `[Applens Detector Publish Request] - id: ${this.queryResponse.invocationOutput.metadata.id}, Name: ${this.queryResponse.invocationOutput.metadata.name}`;
    var body: string = `${this._adalService.userInfo.profile.given_name} - Please attach the detector code file and remove this line. %0D%0A%0D%0AHi,%0D%0AI'd like to update the attached detector at following location:%0D%0A%0D%0A Applens Detector url: ${window.location}`;

    window.open(`mailTo:${toList}?subject=${subject}&body=${body}`, '_blank');
  }

  private UpdateConfiguration(queryResponse: QueryResponse<DetectorResponse>) {
    let temp = {};
    let newPackage = [];
    let ids = !!this.configuration['dependencies'] ? new Set(Object.keys(this.configuration['dependencies'])) : null;
    if (queryResponse.compilationOutput.references != null && ids != null) {
      queryResponse.compilationOutput.references.forEach(r => {
        if (ids.has(r)) {
          temp[r] = this.configuration['dependencies'][r];
        } else {
          newPackage.push(r);
        }
      });
    }

    this.configuration['dependencies'] = temp;
    this.configuration['id'] = queryResponse.invocationOutput.metadata.id;
    this.configuration['name'] = queryResponse.invocationOutput.metadata.name;
    this.configuration['author'] = queryResponse.invocationOutput.metadata.author;
    this.configuration['description'] = queryResponse.invocationOutput.metadata.description;
    this.configuration['category'] = queryResponse.invocationOutput.metadata.category;
    this.configuration['type'] = this.gistMode ? 'Gist' : 'Detector';

    return newPackage;
  }

  private preparePublishingPackage(queryResponse: QueryResponse<DetectorResponse>, code: string) {
    if (queryResponse.invocationOutput.metadata.author !== null && queryResponse.invocationOutput.metadata.author !== "" && this.emailRecipients.indexOf(queryResponse.invocationOutput.metadata.author) < 0) {
      this.emailRecipients += ';' + queryResponse.invocationOutput.metadata.author;
    }

    let newPackage = this.UpdateConfiguration(queryResponse);
    let update = of(null);

    if (this.detectorGraduation && newPackage.length > 0) {
      // Get the commit id of each reference and the gist content.
      update = forkJoin(newPackage.map(r => this.diagnosticApiService.getDevopsChangeList(r, this.resourceId).pipe(
        map(c => this.configuration['dependencies'][r] = c[0].commitId),
        flatMap(v => this.diagnosticApiService.getDevopsCommitContent(`${this.DevopsConfig.folderPath}/${r}/${r}.csx`, v, this.resourceId).pipe(map(s => this.reference[r] = s))))))

    } else {
      if (newPackage.length > 0) {
        update = forkJoin(newPackage.map(r => this.githubService.getChangelist(r).pipe(
          map(c => this.configuration['dependencies'][r] = c[c.length - 1].sha),
          flatMap(v => this.githubService.getCommitContent(r, v).pipe(map(s => this.reference[r] = s))))))
      }
    }

    // update changes here 
    update.subscribe(_ => {
      this.publishingPackage = {
        id: queryResponse.invocationOutput.metadata.id,
        codeString: StringUtilities.ReplaceAll(code, codePrefix, ""),
        committedByAlias: this.userName,
        dllBytes: this.compilationPackage.assemblyBytes,
        pdbBytes: this.compilationPackage.pdbBytes,
        packageConfig: JSON.stringify(this.configuration),
        metadata: JSON.stringify({ "utterances": this.allUtterances }),
        workflowJson: ''
      };
    });
  }

  private showAlertBox(alertClass: string, message: string) {
    this.alertClass = alertClass;
    this.alertMessage = message;
    this.showAlert = true;
  }

  private initialize() {
    this.resourceId = this.resourceService.getCurrentResourceId();
    this.hideModal = localStorage.getItem("localdevmodal.hidden") === "true";
    let detectorFile: Observable<string>;
    let isGradEdit: boolean = false;
    this.recommendedUtterances = [];
    this.utteranceInput = "";

    if (this.detectorGraduation && this.mode == DevelopMode.Edit && this.branchInput != undefined && this.branchInput != '') {
      this.Branch = this.branchInput;
    }
    if (this.detectorGraduation && this.mode != DevelopMode.Create) {
      this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/metadata.json`, this.Branch, this.resourceId).subscribe(res => {
        this.allUtterances = JSON.parse(res).utterances;
      },
        (err) => {
          this.allUtterances = [];
        });
      // Fetch owners.txt when needed. Otherwise leads to noisy errors in API.
      if (Object.keys(this.DevopsConfig.appTypeReviewers).length > 0 || Object.keys(this.DevopsConfig.platformReviewers).length > 0) {
        this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/owners.txt`, this.defaultBranch, this.resourceId).subscribe(o => {
          this.owners = o.split('\n');
        });
      }
    }
    else {
      this.githubService.getMetadataFile(this.id.toLowerCase()).subscribe(res => {
        this.allUtterances = JSON.parse(res).utterances;
      },
        (err) => {
          this.allUtterances = [];
        });
    }
    this.compilationPackage = new CompilationProperties();

    switch (this.mode) {
      case DevelopMode.Create: {
        let templateFileName = (this.gistMode ? "Gist_" : "Detector_") + this.resourceService.templateFileName;
        detectorFile = this.detectorGistApiService.getTemplate(templateFileName);
        this.fileName = "new.csx";
        this.startTime = this._detectorControlService.startTime;
        this.endTime = this._detectorControlService.endTime;
        this._applensGlobal.updateHeader(this.gistMode ? "Create Gist" : this.isWorkflowDetector ? "Create Workflow" : "Create Detector");
        break;
      }
      case DevelopMode.Edit: {
        if (this.detectorGraduation) {
          isGradEdit = true;
          this.fileName = `${this.id.toLowerCase()}.csx`;
          this.deleteAvailable = true;
          detectorFile = this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx`, this.Branch, this.resourceId)
          this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx`, this.defaultBranch, this.resourceId).subscribe(x => {
            this.codeOnDefaultBranch = true;
          }, err => {
            this.codeOnDefaultBranch = false;
          });
        }
        else {
          this.fileName = `${this.id.toLowerCase()}.csx`;
          detectorFile = this.githubService.getSourceFile(this.id.toLowerCase());
        }
        this.startTime = this._detectorControlService.startTime;
        this.endTime = this._detectorControlService.endTime;
        if (this.gistMode) {
          this.diagnosticApiService.getGistMetaData(this.id).subscribe(metaData => {
            if (metaData) this._applensGlobal.updateHeader(metaData.name);
          });
        } else {
          this.diagnosticApiService.getDetectorMetaData(this.id).subscribe(metaData => {
            if (metaData) this._applensGlobal.updateHeader(metaData.name);

          });
        }
        break;
      }
      case DevelopMode.EditMonitoring: {
        this.fileName = '__monitoring.csx';
        detectorFile = this.diagnosticApiService.getDetectorCode('__monitoring/__monitoring.csx', this.Branch, this.SYSTEM_INVOKER_RESOURCE_ID);
        break;
      }
      case DevelopMode.EditAnalytics: {
        this.fileName = '__analytics.csx';
        detectorFile = this.diagnosticApiService.getDetectorCode('__analytics/__analytics.csx', this.Branch, this.SYSTEM_INVOKER_RESOURCE_ID);
        break;
      }
    }

    let configuration = of(null);
    this.codeLoaded = false;
    if (this.id.toLowerCase() !== '') {
      if (!this.detectorGraduation) {
        configuration = this.githubService.getConfiguration(this.id.toLowerCase()).pipe(
          map(config => {
            if (!('dependencies' in config)) {
              config['dependencies'] = {};
            }

            this.configuration = config;
            return this.configuration['dependencies'];
          }),
          flatMap(dep => {
            let keys = Object.keys(dep);
            if (keys.length === 0) return of([]);
            return forkJoin(Object.keys(dep).map(key => this.githubService.getSourceReference(key, dep[key])));
          }));
      }
      else {
        configuration = this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/package.json`, this.Branch, this.resourceId).pipe(
          map(config => {
            let c: object = JSON.parse(config)
            c['dependencies'] = c['dependencies'] || {};
            this.configuration = c;
            return this.configuration['dependencies'];
          }),
          flatMap(dep => {
            let keys = Object.keys(dep);
            if (keys.length === 0) return of([]);
            return forkJoin(Object.keys(dep).map(key => this.getGistCommitContent(key, dep[key])));
          }));
      }
    }
    else {
      if (!('dependencies' in this.configuration)) {
        this.configuration['dependencies'] = {};
      }
    }

    detectorFile.subscribe(res => {
      // if (!this.code)
      this.code = this.addCodePrefix(res);
      this.lastSavedVersion = this.code;
      this.originalCode = this.code;
      this.codeLoaded = true;
      this.initalizeCoPilotServiceMembers();
    }, err => {
      if (isGradEdit && this.Branch === this.defaultBranch && this.showBranches.length > 1) {
        this.Branch = this.showBranches.filter(branch => { return branch.key != this.defaultBranch })[0].key;
        this.displayBranch = this.Branch;
        this.diagnosticApiService.getDetectorCode(`${this.id.toLowerCase()}/${this.id.toLowerCase()}.csx`, this.Branch, this.resourceId).subscribe(c => {
          // if (!this.code)
          this.code = this.addCodePrefix(c);
          this.lastSavedVersion = this.code
          this.originalCode = this.code;
          this.codeLoaded = true;
          this.initalizeCoPilotServiceMembers();
        });
      }
    });

    // For each gist listed in package.json, the commit content is set in the references map.
    forkJoin(configuration, this.diagnosticApiService.getGists()).subscribe(res => {
      if (res[0] !== null) {
        this.gists = Object.keys(this.configuration['dependencies']);
        this.gists.forEach((name, index) => {
          this.reference[name] = res[0][index];
        });
      }

      if (res[1] !== null) {
        res[1].forEach(m => {
          this.allGists.push(m.id);
        });
      }
    });
  }

  // Loose way to identify if the detector code is marked public or not
  // Unfortunately, we dont return this flag in the API response.
  private IsDetectorMarkedPublic(codeString: string): boolean {
    if (codeString) {
      var trimmedCode = codeString.toLowerCase().replace(/\s/g, "");
      return trimmedCode.includes('internalonly=false') || trimmedCode.includes('internalonly:false');
    }

    return false;
  }

  getIdFromCodeString(): string {
    var trimmedCode = this.code.toLowerCase().replace(/\s/g, "");
    let id = trimmedCode.match(/(?<=\[definition\(id=").*?(?=",)/gmi);
    return id == null ? null : id[0];
  }

  getGistCommitContent = (gistId, gistCommitVersion) => {
    return this.diagnosticApiService.getDevopsCommitContent(`${this.DevopsConfig.folderPath}/${gistId}/${gistId}.csx`, gistCommitVersion, this.resourceId);
  };

  updatePRTitle(e: { event: Event, newValue?: string }) {
    this.PRTitle = e.newValue.toString();
  }

  getNewMatDialogConfig(): MatDialogConfig {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.height = "calc(100% - 150px)";
    dialogConfig.width = "calc(100% - 30px)";
    dialogConfig.maxWidth = "100%";
    dialogConfig.maxHeight = "100%";
    dialogConfig.disableClose = true;
    return dialogConfig;
  }

  downloadWorkflow() {
    this.createWorkflow.showFlowData();
  }

  async uploadWorkflow($event) {
    let file = $event.target.files[0];
    const text = await file.text();
    this.createWorkflow.uploadFlowData(text);
  }
  //#region Copilot Methods

  initalizeCoPilotServiceMembers() {
    this._detectorDevelopmentCopilotService.azureServiceType = this.resourceService.displayName;
    this._detectorDevelopmentCopilotService.detectorDevelopMode = this.mode;
    this._detectorDevelopmentCopilotService.detectorCode = StringUtilities.ReplaceNewlines(this.code);
    this._detectorDevelopmentCopilotService.initializeMembers(this.gistMode);
    if (this.mode == DevelopMode.Create) {
      this._detectorDevelopmentCopilotService.detectorTemplate = StringUtilities.ReplaceNewlines(this.code);
    }
    else {
      this._detectorDevelopmentCopilotService.detectorTemplate = '';
    }

    setTimeout(() => {
      if (this.copilotCodeSuggestionObservable == undefined) {
        this.copilotCodeSuggestionObservable = this._detectorDevelopmentCopilotService.onCodeSuggestion.subscribe(event => {
          if (event == null || event == undefined || event.code == null || event.code == undefined)
            return;

          if (!event.append) {
            this.code = '';
          }

          if (event.source && event.source.toLowerCase() == 'openai') {
            this.triggerCodeCopyFromCopilot(event.code);
          }
          else {
            this.code = `${this.code}${event.code}`;
          }
        });
      }

      if (this.copilotCodeUpdateProgressStateObservable == undefined) {
        this.copilotCodeUpdateProgressStateObservable = this._detectorDevelopmentCopilotService.onCodeOperationProgressState.subscribe(res => {
          if (res) {
            this._monacoEditor.updateOptions({ readOnly: res.inProgress });
          }
        }, err => {
          this._monacoEditor.updateOptions({ readOnly: false });
        });
      }

    }, 2000);

    this.copilotServiceMembersInitialized = true;
  }

  triggerCodeCopyFromCopilot(codeSuggestionFromCopilot: string, index: number = 0) {

    let minChunkSize: number = 50;
    if (index >= codeSuggestionFromCopilot.length) {
      return;
    }

    let chunkSize = Math.floor(Math.random() * (codeSuggestionFromCopilot.length - index)) + 1;

    if (chunkSize < minChunkSize) {
      chunkSize = minChunkSize;
    }

    let upperIndex = index + chunkSize >= codeSuggestionFromCopilot.length ? codeSuggestionFromCopilot.length : index + chunkSize;
    this.code = `${this.code}${codeSuggestionFromCopilot.substring(index, upperIndex)}`;

    index += chunkSize;
    const delayTime = codeSuggestionFromCopilot.length <= 2 * minChunkSize ? 300 : 200;
    setTimeout(() => {
      this.triggerCodeCopyFromCopilot(codeSuggestionFromCopilot, index);
    }, delayTime);
  }

  // Whenever the detector code changes, we need to keep code copilot service in sync
  updateCodeEvent(event: any) {
    this.code = event;
    this._detectorDevelopmentCopilotService.detectorCode = event;
  }

  //#endregion

}