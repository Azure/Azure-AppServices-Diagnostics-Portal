import { AdalService } from 'adal-angular4';
import {
  CompilationProperties, DetectorControlService, DetectorResponse, HealthStatus, QueryResponse, CompilationTraceOutputDetails, LocationSpan, Position
} from 'diagnostic-data';
import * as momentNs from 'moment';
import { NgxSmartModalService } from 'ngx-smart-modal';
import {
  forkJoin
  , Observable, of
} from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Package } from '../../../shared/models/package';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { RecommendedUtterance } from '../../../../../../diagnostic-data/src/public_api';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { environment } from '../../../../environments/environment';
import { IButtonStyles, IChoiceGroupOption, IContextualMenuItem, IDropdownOption, IDropdownProps, IPanelProps, IPivotProps, PanelType } from 'office-ui-fabric-react';
import { addMonths } from 'office-ui-fabric-react/lib/utilities/dateMath/DateMath';
import { BehaviorSubject } from 'rxjs';
import { ICommandBarItemOptions } from '@angular-react/fabric/src/lib/components/command-bar/public-api';
import { Commit } from '../../../shared/models/commit';
import { Body } from '@angular/http/src/body';


const moment = momentNs;
const newDetectorId: string = "NEW_DETECTOR";

// const commandbaritems: ICommandBarItemProps[] = [
//   {
//     key: 'newItem',
//     text: 'New',
//     cacheKey: 'myCacheKey', // changing this key will invalidate this item's cache
//     iconProps: { iconName: 'Add' },
//     subMenuProps: {
//       items: [
//         {
//           key: 'emailMessage',
//           text: 'Email message',
//           iconProps: { iconName: 'Mail' },
//           ['data-automation-id']: 'newEmailButton', // optional
//         },
//         {
//           key: 'calendarEvent',
//           text: 'Calendar event',
//           iconProps: { iconName: 'Calendar' },
//         },
//       ],
//     },
//   },
//   {
//     key: 'upload',
//     text: 'Upload',
//     iconProps: { iconName: 'Upload' },
//     href: 'https://developer.microsoft.com/en-us/fluentui',
//   },
//   {
//     key: 'share',
//     text: 'Share',
//     iconProps: { iconName: 'Share' },
//     onClick: () => console.log('Share'),
//   },
//   {
//     key: 'download',
//     text: 'Download',
//     iconProps: { iconName: 'Download' },
//     onClick: () => console.log('Download'),
//   },
// ];

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
export class OnboardingFlowComponent implements OnInit {
  @Input() mode: DevelopMode = DevelopMode.Create;
  @Input() id: string = '';
  @Input() dataSource: string = '';
  @Input() timeRange: string = '';
  @Input() startTime: momentNs.Moment = moment.utc().subtract(1, 'days');
  @Input() endTime: momentNs.Moment = moment.utc();
  @Input() gistMode: boolean = false;

  DevelopMode = DevelopMode;
  HealthStatus = HealthStatus;
  PanelType = PanelType;

  hideModal: boolean = true;
  fileName: string;
  editorOptions: any;
  code: string;
  originalCode: string;
  reference: object = {};
  configuration: object = {};
  resourceId: string;
  queryResponse: QueryResponse<DetectorResponse>;
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
  dialogTitle: string = "Publish for review";
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
  showBranches: IChoiceGroupOption[] = [];
  displayBranch: string = "";
  optionsForSingleChoice: IChoiceGroupOption[] = [];
  openTimePickerCallout: boolean = false;
  timePickerButtonStr: string = "";
  showCalendar: boolean = false;
  showTimePicker: boolean = false;
  gistDialogHidden: boolean = true;
  gistVersion: string;
  gistName: string;
  gistsDropdownOptions: IDropdownOption[] = [];
  gistVersionOptions: IDropdownOption[] = [];
  gistUpdateTitle
  internalExternalText: string = "";
  internalViewText: string = "Internal view";
  externalViewText: string = "Customer view";
  defaultSelectedKey: string;
  currentTime: string = "";
  publishSuccess: boolean = false;
  publishFailed: boolean = false;
  detectorName: string = "";
  submittedPanelTimer: any = null;
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  runButtonStyle: any = {
    root: { cursor: "default" }
  };
  publishButtonStyle: any = {
    root: {
      cursor: "not-allowed",
      color: "grey"
    }
  };

  detectorGraduation: boolean;

  buttonStyle: IButtonStyles = {
    root: {
      color: "#323130",
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
      color: "#323130",
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

  runIcon: any = { iconName: 'Play' };

  publishIcon: any = {
    iconName: 'Upload',
    styles: {
      root: { color: "grey" }
    }
  };

  submittedPanelStyles: IPanelProps["styles"] = {
    root: {
      height: "120px"
    },
    content: {
      padding: "0px"
    }
  }

  modalPublishingButtonText: string;
  modalPublishingButtonDisabled: boolean;
  publishAccessControlResponse: any;

  alertClass: string;
  alertMessage: string;
  showAlert: boolean;

  compilationPackage: CompilationProperties;

  initialized = false;
  codeLoaded: boolean = false;

  private publishingPackage: Package;
  private userName: string;

  private emailRecipients: string = '';
  private _monacoEditor: monaco.editor.ICodeEditor = null;
  private _oldCodeDecorations: string[] = [];


  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService,
    private diagnosticApiService: ApplensDiagnosticService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService,
    public ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService) {
    this.editorOptions = {
      theme: 'vs',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true
    };

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
    this.publishButtonText = "Publish";
    this.modalPublishingButtonText = "Publish";
    this.modalPublishingButtonDisabled = false;
    this.showAlert = false;

    this.userName = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.emailRecipients = this.userName.replace('@microsoft.com', '');
    this.publishAccessControlResponse = {};
  }

  updateTempBranch(event: any) {
    //console.log(event);
    this.tempBranch = event.option.key;
  }

  updateBranch() {
    this.Branch = this.tempBranch;
    this.displayBranch = this.Branch;
    this.diagnosticApiService.getDetectorCode(`${this.id}/${this.id}.csx`, this.Branch, this.resourceId).subscribe(x => {
      this.code = x;
    });
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

  publishButtonOnClick() {
    if (this.detectorGraduation) {
      this.showPublishDialog();
    }
    else {
      this.publish()
    }
  }


  ngOnInit() {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
      this._telemetryService.logPageView(TelemetryEventNames.OnboardingFlowLoaded, {});
    }

    this._detectorControlService.timePickerStrSub.subscribe(s => {
      this.timePickerButtonStr = s;
    });

    this.diagnosticApiService.getDetectorGraduationSetting().subscribe(graduationFlag => {
      this.detectorGraduation = graduationFlag;
    });

    this.getBranchList();

    if (this._detectorControlService.isInternalView) {
      this.internalExternalText = this.internalViewText;
    }
    else {
      this.internalExternalText = this.externalViewText;
    }
  }

  getBranchList() {
    this.optionsForSingleChoice = [];
    this.showBranches = [];

    this.diagnosticApiService.getBranches(this.resourceId).subscribe(branches => {
      var branchRegEx = new RegExp(`^dev\/.*\/detector\/${this.id}$`, "i");
      branches.forEach(option => {
        this.optionsForSingleChoice.push({
          key: String(option["item1"]),
          text: String(option["item1"])
        });
        if (option["item2"]) {
          this.defaultBranch = String(option["item1"]);
        }
        if (option["item2"] && !(this.mode == DevelopMode.Create)) {// if main branch and in edit mode
          this.showBranches.push({
            key: String(option["item1"]),
            text: String(option["item1"])
          });
        }
      })
      this.optionsForSingleChoice.forEach(branch => {
        if (branchRegEx.test(branch.text) && this.id != "") {
          this.showBranches.push({
            key: String(branch.key),
            text: String(`${branch.text.split("/")[1]} : ${branch.text.split("/")[3]}`)
          });
        }
      });
      if (this.showBranches.length < 1) {
        this.noBranchesAvailable();
      }
      else {
        var targetBranch = `dev/${this.userName.split("@")[0]}/detector/${this.id}`
        this.Branch = this.targetInShowBranches(targetBranch) ? targetBranch : this.showBranches[0].key;
        this.displayBranch = this.Branch;
      }
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

  onInit(editor: any) {
    this._monacoEditor = editor;
  }

  ngOnChanges() {
    if (this.initialized) {
      this.initialize();
    }
  }

  gistVersionChange() {
    var newGist;

    Object.keys(this.temporarySelection).forEach(id => {
      if (this.temporarySelection[id]['version'] !== this.configuration['dependencies'][id]) {
        this.configuration['dependencies'][id] = this.temporarySelection[id]['version'];
        this.reference[id] = this.temporarySelection[id]['code'];
      }
    });

    this.gistDialogHidden = true;
  }

  updateGistVersionOptions(event: string) {
    this.gistName = event["option"].text;
    this.gistVersionOptions = [];
    var tempList = [];
    this.githubService.getChangelist(this.gistName)
      .subscribe((version: Commit[]) => {
        version.forEach(v => tempList.push({
          key: String(`${v["sha"]}`),
          text: String(`${v["author"]}: ${v["dateTime"]}`),
          title: String(`${this.gistName}`)
        }));
        this.gistVersionOptions = tempList.reverse();
        if (this.gistVersionOptions.length > 10) { this.gistVersionOptions = this.gistVersionOptions.slice(0, 10); }
      });

  }

  gistVersionOnChange(event: string) {
    this.temporarySelection[event["option"]["title"]]['version'] = event["option"]["key"];

    this.githubService.getCommitContent(event["option"]["title"], this.temporarySelection[event["option"]["title"]]['version']).subscribe(x => {
      this.temporarySelection[event["option"]["title"]]['code'] = x;
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

  confirm() {
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

  /*downloadCode(){
    var a = document.getElementById("a");
    var file = new Blob([this.id], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
  }*/

  saveProgress() {
    localStorage.setItem(`${this.id}_code`, this.code);
  }

  retrieveProgress() {
    let savedCode: string = localStorage.getItem(`${this.id}_code`)
    if (savedCode) {
      this.code = savedCode;
    }
  }

  deleteProgress() {
    localStorage.removeItem(`${this.id}_code`);
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

    this.diagnosticApiService.prepareLocalDevelopment(body, this.id, this._detectorControlService.startTimeString,
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

  runCompilation() {
    if (this.runButtonDisabled) {
      return;
    }
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

    this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, this.id, this._detectorControlService.startTimeString,
      this._detectorControlService.endTimeString, this.dataSource, this.timeRange, {
      scriptETag: this.compilationPackage.scriptETag,
      assemblyName: this.compilationPackage.assemblyName,
      getFullResponse: true
    }, this.getDetectorId())
      .subscribe((response: any) => {
        this.queryResponse = response.body;
        if (this.queryResponse.invocationOutput && this.queryResponse.invocationOutput.metadata && this.queryResponse.invocationOutput.metadata.id && !isSystemInvoker) {
          this.id = this.queryResponse.invocationOutput.metadata.id;
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
          this.enablePublishButton();
        }

        this.localDevButtonDisabled = false;
        this.markCodeLinesInEditor(this.detailedCompilationTraces);
      }, ((error: any) => {
        this.enableRunButton();
        this.publishingPackage = null;
        this.localDevButtonDisabled = false;
        this.runButtonText = "Run";
        this.runButtonIcon = "fa fa-play";
        this.buildOutput.push("Something went wrong during detector invocation.");
        this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
        this.detailedCompilationTraces.push({
          severity: HealthStatus.Critical,
          message: 'Something went wrong during detector invocation.',
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
        this.markCodeLinesInEditor(this.detailedCompilationTraces);
      }));
  }

  getDetectorId(): string {
    if (this.mode === DevelopMode.Edit) {
      return this.id;
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
    this.publishingPackage.metadata = JSON.stringify({ "utterances": this.allUtterances });
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

  showPublishDialog() {
    var targetBranch = `dev/${this.userName.split("@")[0]}/detector/${this.id}`
    if (this.publishButtonDisabled) {
      return;
    }
    if (this.Branch === this.defaultBranch && this.targetInShowBranches(targetBranch)) {
      this.Branch = targetBranch;
      this.displayBranch = `${targetBranch}`;
    }
    else if (!(this.showBranches.length > 1) || this.Branch === this.defaultBranch) {
      this.displayBranch = `${targetBranch} (not published)`;
      this.Branch = targetBranch;
    }
    if (this.mode == DevelopMode.Create) {
      this.PRTitle = `Creating ${this.id}`;
    }
    else {
      this.PRTitle = `Changes to ${this.id}`;
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
    }, 100000);
  }

  dismissPublishSuccessHandler() {
    this.publishSuccess = false;
    this.publishFailed = false;
  }



  publish() {
    if (this.publishButtonDisabled) {
      return;
    }

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
    this.modalPublishingButtonText = "Publishing";
    var isOriginalCodeMarkedPublic: boolean = this.IsDetectorMarkedPublic(this.originalCode);
    if (this.detectorGraduation) {
      this.gradPublish(this.publishingPackage);
    }
    else {
      this.diagnosticApiService.publishDetector(this.emailRecipients, this.publishingPackage, `${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`, isOriginalCodeMarkedPublic).subscribe(data => {
        this.originalCode = this.publishingPackage.codeString;
        this.deleteProgress();
        this.utteranceInput = "";
        this.enableRunButton();
        this.localDevButtonDisabled = false;
        this.publishButtonText = "Publish";
        this.enablePublishButton();
        this.modalPublishingButtonText = "Publish";
        this.ngxSmartModalService.getModal('publishModal').close();
        this.detectorName = this.publishingPackage.id;
        this.publishSuccess = true;
        //this.showAlertBox('alert-success', 'Detector published successfully. Changes will be live shortly.');

        this._telemetryService.logEvent("SearchTermPublish", { detectorId: this.id, numUtterances: this.allUtterances.length.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
      }, err => {
        this.enableRunButton();
        this.localDevButtonDisabled = false;
        this.publishButtonText = "Publish";
        this.enablePublishButton();
        this.modalPublishingButtonText = "Publish";
        this.ngxSmartModalService.getModal('publishModal').close();
        this.showAlertBox('alert-danger', 'Publishing failed. Please try again after some time.');
        this.publishFailed = true;
      });
    }
  }

  gradPublish(publishingPackage: Package) {
    this.publishDialogHidden = true;

    const commitType = this.mode == DevelopMode.Create ? "add" : "edit";
    const commitMessageStart = this.mode == DevelopMode.Create ? "Adding" : "Editing";

    const DetectorCodeObservable = this.diagnosticApiService.pushDetectorChanges(this.Branch, publishingPackage.codeString, `/${publishingPackage.id}/${publishingPackage.id}.csx`, `Adding detector code for ${publishingPackage.id}`, "add", this.resourceId);
    const MetaDataObservable = this.diagnosticApiService.pushDetectorChanges(this.Branch, publishingPackage.metadata, `/${publishingPackage.id}/metadata.json`, `Adding metadata.json for ${publishingPackage.id}`, "add", this.resourceId);
    const PackageObservable = this.diagnosticApiService.pushDetectorChanges(this.Branch, publishingPackage.packageConfig, `/${publishingPackage.id}/package.json`, `Adding package.json for ${publishingPackage.id}`, "add", this.resourceId);
    const makePullRequestObservable = this.diagnosticApiService.makePullRequest(this.Branch, this.defaultBranch, this.PRTitle, this.resourceId);

    DetectorCodeObservable.subscribe(_ => {
      MetaDataObservable.subscribe(_ => {
        PackageObservable.subscribe(_ => {
          makePullRequestObservable.subscribe(_ => {
            this.publishSuccess = true;
            this.postPublish();
          }, err => {
            this.publishFailed = true;
            this.postPublish();
          });
        }, err => {
          this.publishFailed = true;
          this.postPublish();
        });
      }, err => {
        this.publishFailed = true;
        this.postPublish();
      });
    }, err => {
      this.publishFailed = true;
      this.postPublish();
    });
  }

  postPublish() {
    this.modalPublishingButtonText = "Publish";
    this.getBranchList();
    this.enablePublishButton();
    this.enableRunButton();
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
    let ids = new Set(Object.keys(this.configuration['dependencies']));
    if (queryResponse.compilationOutput.references != null) {
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
    if (newPackage.length > 0) {
      update = forkJoin(newPackage.map(r => this.githubService.getChangelist(r).pipe(
        map(c => this.configuration['dependencies'][r] = c[c.length - 1].sha),
        flatMap(v => this.githubService.getCommitContent(r, v).pipe(map(s => this.reference[r] = s))))))
    }

    update.subscribe(_ => {
      this.publishingPackage = {
        id: queryResponse.invocationOutput.metadata.id,
        codeString: code,
        committedByAlias: this.userName,
        dllBytes: this.compilationPackage.assemblyBytes,
        pdbBytes: this.compilationPackage.pdbBytes,
        packageConfig: JSON.stringify(this.configuration),
        metadata: JSON.stringify({ "utterances": this.allUtterances })
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
    this.recommendedUtterances = [];
    this.utteranceInput = "";
    this.githubService.getMetadataFile(this.id).subscribe(res => {
      this.allUtterances = JSON.parse(res).utterances;
    },
      (err) => {
        this.allUtterances = [];
      });
    this.compilationPackage = new CompilationProperties();

    switch (this.mode) {
      case DevelopMode.Create: {
        let templateFileName = (this.gistMode ? "Gist_" : "Detector_") + this.resourceService.templateFileName;
        detectorFile = this.githubService.getTemplate(templateFileName);
        this.fileName = "new.csx";
        this.startTime = this._detectorControlService.startTime;
        this.endTime = this._detectorControlService.endTime;
        break;
      }
      case DevelopMode.Edit: {
        this.fileName = `${this.id}.csx`;
        detectorFile = this.githubService.getSourceFile(this.id);
        this.startTime = this._detectorControlService.startTime;
        this.endTime = this._detectorControlService.endTime;
        break;
      }
      case DevelopMode.EditMonitoring: {
        this.fileName = '__monitoring.csx';
        detectorFile = this.githubService.getSourceFile("__monitoring");
        break;
      }
      case DevelopMode.EditAnalytics: {
        this.fileName = '__analytics.csx';
        detectorFile = this.githubService.getSourceFile("__analytics");
        break;
      }
    }

    let configuration = of(null);
    if (this.id !== '') {
      configuration = this.githubService.getConfiguration(this.id).pipe(
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
    } else {
      if (!('dependencies' in this.configuration)) {
        this.configuration['dependencies'] = {};
      }
    }

    forkJoin(detectorFile, configuration, this.diagnosticApiService.getGists()).subscribe(res => {
      this.codeLoaded = true;
      if (this.detectorGraduation && !(this.mode == DevelopMode.Create)){
        this.diagnosticApiService.getDetectorCode(`${this.id}/${this.id}.csx`, this.Branch, this.resourceId).subscribe(x => {
          this.code = x;
        }); 
      }
      else{
        this.code = res[0];
      }
      this.originalCode = this.code;
      if (res[1] !== null) {
        this.gists = Object.keys(this.configuration['dependencies']);
        this.gists.forEach((name, index) => {
          this.reference[name] = res[1][index];
        });
      }

      if (res[2] !== null) {
        res[2].forEach(m => {
          this.allGists.push(m.id);
        });
      }

      // if (!this.hideModal && !this.gistMode) {
      //   this.ngxSmartModalService.getModal('devModeModal').open();
      // }
    });
  }

  // Loose way to identify if the detector code is marked public or not
  // Unfortunately, we dont return this flag in the API response.
  private IsDetectorMarkedPublic(codeString: string): boolean {
    if (codeString) {
      var trimmedCode = codeString.toLowerCase().replace(/\s/g, "");
      return trimmedCode.includes('internalonly=false)') || trimmedCode.includes('internalonly:false)');
    }

    return false;
  }

  // ngOnDestroy() {

  // }
}
