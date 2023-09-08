import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable, ReplaySubject, of, forkJoin } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { IBasePickerProps, ITagPickerProps, ITagItemProps, ISuggestionModel, ITag, TagItem, IButtonStyles, IChoiceGroupOption, IDialogContentProps, IDialogProps, IDropdownOption, IDropdownProps, IIconProps, IPanelProps, IPersona, IPersonaProps, IPickerItemProps, IPivotProps, ITextFieldProps, MessageBarType, PanelType, SelectableOptionMenuItemType, TagItemSuggestion, IDropdown, ICalloutProps, ICheckboxStyleProps, ICheckboxProps } from 'office-ui-fabric-react';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { DetectorGistApiService } from '../../../shared/services/detectorgist-template-api.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { DetectorControlService, DetectorMetaData, DetectorType, GenericThemeService, RenderingType, TelemetryService } from 'diagnostic-data';
import { AdalService } from 'adal-angular4';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { ApplensCommandBarService } from '../services/applens-command-bar.service';
import { IDeactivateComponent } from '../develop-navigation-guard.service';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';
import { takeLast } from 'rxjs-compat/operator/takeLast';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { RenderPropOptions } from '@angular-react/core';
import { ValidationState } from '@fluentui/react/lib/Pickers';
import { FabPeoplePickerComponent } from '@angular-react/fabric/lib/components/pickers';
import { SiteService } from '../../../shared/services/site.service';
import { ObserverSiteInfo } from '../../../shared/models/observer';
import { AppType, PlatformType, SitePropertiesParser, StackType } from '../../../shared/utilities/applens-site-properties-parsing-utilities';
import { Options } from 'ng5-slider';
import { AnalysisPickerModel, DetectorSettingsModel, EntityType, SupportTopic, SupportTopicPickerModel } from '../models/detector-designer-models/detector-settings-models';
import { ComposerNodeModel } from '../models/detector-designer-models/node-models';
import { Guid } from 'projects/diagnostic-data/src/lib/utilities/guid';
import { INodeModelChangeEventProps, executionState } from '../node-composer/node-composer.component';
import { KustoDataSourceSettings, NoCodeDetector, NoCodeExpressionBody, NoCodeExpressionResponse, NoCodeGraphRenderingProperties, NoCodeInsightRenderingProperties, NoCodeMarkdownRenderingProperties, NoCodePackage, NoCodeSupportedDataSourceTypes, NoCodeTableRenderingProperties, NodeSettings, nodeJson } from '../dynamic-node-settings/node-rendering-json-models';
import * as moment from 'moment';
import { NodeCompatibleEventEmitter } from 'rxjs/internal/observable/fromEvent';
import { DevopsConfig } from '../../../shared/models/devopsConfig';
import { element } from 'protractor';


@Component({
  selector: 'detector-designer',
  templateUrl: './detector-designer.component.html',
  styleUrls: ['./detector-designer.component.scss']
})

export class DetectorDesignerComponent implements OnInit, IDeactivateComponent  {
  @Input() mode: DevelopMode = DevelopMode.Create;
  @Input() detectorId:string = '';

  DevelopMode = DevelopMode;

  executionState = executionState;
  state = this.executionState.default;
  errorMessage: string = "";

  detectorName:string = 'Settings Panel Name';//'Auto Generated Detector Name';
  //detectorPanelOpen:boolean = true;
  detectorPanelOpenObservable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  detectorLoaded: boolean = false;

  PanelType = PanelType;
  RenderingType = RenderingType;

  fabTextFieldStyle: ITextFieldProps["styles"] = {
    wrapper: {
      display: 'flex',
      justifyContent: 'space-between'
    },
    field: {
      width: '300px'
    }
  };
  fabTextFieldStyleWide: ITextFieldProps["styles"] = {
    wrapper: {
      display: 'flex',
    },
    field: {
      width: '400px'
    }
  };

  fabTextFieldStyleNoStretch: ITextFieldProps["styles"] = {
    //wrapper: {
      //display: 'flex',
    //},
    field: {
      width: '300px'
    }
  };

  fabTextFieldStyleNoStretchWide: ITextFieldProps["styles"] = {
    wrapper: {
      display: 'flex',
    },
    field: {
      width: '400px'
    }
  };

  fabDropdownStyle: IDropdownProps["styles"] = {
    root: {
      display: 'flex',
      minWidth:'100px'
    },
    label: {
      paddingRight: '1em'
    },
    dropdownItem:{
      width:'200px'
    },
    errorMessage:{
      paddingLeft:'1em'
    },
    dropdown:{
      minWidth:'100px'
    }
  };

  fabDropdownMultiselectCalloutProps:IDropdownProps['calloutProps']= {
    styles:{
      root:{
        width:'200px'
      }
    }
  };

  fabCheckboxStyle:  ICheckboxProps['styles'] = {
    text:{
      fontWeight: 600
    }
  };

  runButtonText:string = "Run";
  runIcon: any = { iconName: 'Play' };
  runButtonDisabled: boolean = false;


  saveButtonVisibilityStyle: any = {};
  saveButtonText:string = 'Save';
  saveIcon: any = { iconName: 'Save' };

  modalPublishingButtonText:string = 'Publish';
  publishIcon: any = {
    iconName: 'Upload',
    styles: {
      root: { color: "grey" }
    }
  };
  publishButtonDisabled:boolean = true;

  //#region Panel Footer variables
  notifyPanelCloseSubject: Subject<string> = new Subject<string>();
  //#endregion Panel Footer variables

  //#region Detector settings variables
  // detectorSettingsButtonText:string = 'Settings';
  // settingsIcon: any = { iconName: 'Settings' };
  // detectorSettingsPanelOpenState: boolean = false;
  //#endregion Detector settings variables

  //#region Detector settings variables
  detectorSettingsButtonText:string = 'Settings';
  settingsIcon: any = { iconName: 'Settings' };
  detectorSettingsPanelOpenState: boolean = false;
  detectorSettingsPanelValue: DetectorSettingsModel;
  //#endregion Detector settings variables


  //#region Graduation branch picker variables
  userAlias: string = '';
  detectorGraduation: boolean = false;
  isBranchCallOutVisible: boolean = false;
  branchButtonDisabled: boolean = false;
  showBranches: IChoiceGroupOption[] = [{key: "", text: ""}];
  optionsForSingleChoice: IChoiceGroupOption[] = [{key: "", text: ""}];
  displayBranch: string = "NA (not published)";
  tempBranch: string = "";
  mainBranch: string = "";
  pillButtonStyleBranchPicker: IButtonStyles = {
    root: {
      //   color: "#323130",
      borderRadius: "12px",
      marginTop: "8px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "10",
      fontWeight: "600",
      height: "80%"
    }
  };
  detectorJson = "";
  nodeExpressionList: NoCodeExpressionBody[] = [];
  detectorNodes: any = null;
  autoMerge: boolean = false;
  devopsConfig: DevopsConfig;
  isProd: boolean = true;
  PPEHostname: string = '';
  PPELink: string = '';
  owners: string[] = [];
  branchInput: string = '';
  //#endregion Graduation branch picker variables

  //#region Time picker variables
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  timePickerButtonStr: string = "";
  pillButtonStyleTimePicker: IButtonStyles = {
    root: {
      //  color: "#323130",
      borderRadius: "12px",
      marginTop: "8px",
      marginRight: "10px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "13",
      fontWeight: "600",
      height: "80%"
    }
  }
  
  //#region Time picker variables

  //#region Detector settings panel variables
  //detectorId:string = '';  
  //#endregion Detector settings panel variables

  initialized: boolean = false;  

  resetSettingsPanel(): void {
    this.detectorSettingsPanelValue = new DetectorSettingsModel(this.resourceService.ArmResource.provider.replace(/[\. ]/g, '_').replace(/[^\w. ]/g, ""), this.resourceService.ArmResource.resourceTypeName.replace(/[\. ]/g, '_').replace(/[^\w. ]/g, ""));
    //this.detectorSettingsPanelValue.id = this.detectorSettingsPanelValue.id.replace(/\./g, "_");
    this.detectorSettingsPanelValue.name = this.detectorName;
    this.detectorId = this.detectorSettingsPanelValue.id;
    this.detectorSettingsPanelValue.authors = [this.userAlias];
    this.detectorSettingsPanelValue.isInternalOnly = true;


    
  
    if(this.detectorSettingsPanelValue.isAppService) {
      //TODO: Initialize this with whatever the detector is currently set to.
      this.detectorSettingsPanelValue.appTypes = [AppType.All];

      let resourceReady =  (this.resourceService.ArmResource?.resourceGroup && this.resourceService.ArmResource?.resourceName) ? this.resourceService.getCurrentResource() : of(null);    
      resourceReady.subscribe(resource => {
        if (resource) {
          if (resource["IsLinux"] && resource["IsLinux"].toLowerCase() === "true") {
            this.detectorSettingsPanelValue.platformTypes = [PlatformType.Linux];
          } else {
            this.detectorSettingsPanelValue.platformTypes = [PlatformType.Windows];
          }
        } 
      });
      this.detectorSettingsPanelValue.stackTypes = [StackType.All];
    } else {
    }

  }

  resetGlobals(): void {
    this.detectorName = 'detectorName';//'Auto Generated Detector Name';
    this.resetSettingsPanel();
     this.resetComposerNodes();
  }
  public resetComposerNodes(): void {       
  }

  
  isNodeValid = (node: ComposerNodeModel): string => {
    if (node.queryName){
      if (this.elements.some( element => element.id != node.id && element.queryName.toLowerCase() === node.queryName.toLowerCase())) {
        return 'Duplicate query name';
      }
      else {
        return '';
      }
    }
    else {
      return 'Query name is required';
    }
  }

  nodesValid(): boolean {
    return this.elements.some(element => !element.isValid)
  }
  //#region Element composer
  elements:ComposerNodeModel[] = [
    // {
    //   id: Guid.newGuid(),
    //   queryName: 'firstQuery',
    //   code:'<query>\r\n',
    //   renderingType:RenderingType.Table,
    //   settings: new NodeSettings,
    // }
    /*,
    {
      id: Guid.newGuid(),
      queryName: 'secondQuery',
      code:'',
      renderingType:RenderingType.Table
    },
    {
      id: Guid.newGuid(),
      queryName: 'thirdQuery',
      code:'',
      renderingType:RenderingType.Table
    }*/
  ];

    // fabDropdownStyle: IDropdownProps["styles"] = {
    //   root: {
    //     minWidth: '100px'
    //   },
    //   dropdownItem: {
    //     width: '200px'
    //   },
    //   errorMessage: {
    //     paddingLeft: '0em'
    //   },
    //   dropdown: {
    //     minWidth: '100px'
    //   }
    // };

  //#endregion Element composer


  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService, private detectorGistApiService: DetectorGistApiService,
    public diagnosticApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService,
    public ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService, private _activatedRoute: ActivatedRoute,
    private _applensCommandBarService: ApplensCommandBarService, private _router: Router, private _themeService: GenericThemeService, private _applensGlobal: ApplensGlobal ) {
    this._applensGlobal.updateHeader('');
    
    //if (this.mode == DevelopMode.Create) this.resetGlobals();
  }

  // startTime: moment.Moment;
  // endTime: moment.Moment;

  ngOnInit() {
    // this.startTime = this._detectorControlService.startTime;
    // this.endTime = this._detectorControlService.endTime;
    this.userAlias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn.replace('@microsoft.com', '') : '';
    this._activatedRoute.params.subscribe((params: Params) => {
      this.initialized = false;
      this._detectorControlService.timePickerStrSub.subscribe(s => {
        this.timePickerButtonStr = s;
      });
      this.startUp();
    });
    if (this.mode == DevelopMode.Create) {
      this.resetGlobals();
      this.elements.push(new ComposerNodeModel);
      this.elements[0].queryName = 'firstQuery';
    }
  }

  startUp(){
    this.diagnosticApiService.getPPEHostname().subscribe(host => {
      this.PPEHostname = host;
      this.diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
        this.PPELink = `${this.PPEHostname}${this._router.url}`;
        this.isProd = env === "Prod";
        if (this.isProd) {
          window.open(this.PPELink, '_blank');
          this.mode === DevelopMode.Create ? window.open(this._router.url.replace('/designDetector?', '?'), '_self') : window.open(this._router.url.replace('/nocodeedit?', '?'), '_self');
        }
      });
    });

    this.detectorGraduation = true;
    
    this.diagnosticApiService.getDevopsConfig(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(devopsConfig => {
      //this.noBranchesAvailable();
      this.detectorGraduation = devopsConfig.graduationEnabled;
      this.devopsConfig = new DevopsConfig(devopsConfig);
      this.autoMerge = devopsConfig.autoMerge
    });

    this.diagnosticApiService.getBranches(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(branches => {
        this.mainBranch = branches.find(branch => branch.isMainBranch.toLowerCase() === 'true').branchName;
        
        if (this.mode != DevelopMode.Create) {
          this.editStartUp(branches);
        }
        else {
          this.createStartUp(branches);
        }

        if (this.showBranches.length < 1) this.noBranchesAvailable();

        this.detectorLoaded = true;
    });
  }

  editStartUp(branches: { branchName: string, isMainBranch: string }[]) {
    this.branchInput = this._activatedRoute.snapshot.queryParams['branchInput'];
    if (!!this.branchInput && branches.find(branch => branch.branchName === this.branchInput))
      this.displayBranch = this.branchInput;

    var branchRegEx = new RegExp(`dev\/.*\/noCodeDetector\/${this.detectorId}`);
    branches = branches.filter(bn => {
      return branchRegEx.test(bn.branchName);
    });

    this.showBranches = branches.map(branch => {
      return { key: branch.branchName, text: `${branch.branchName.split('/')[1]} : ${branch.branchName.split('/')[3]}` };
    });

    // branches.forEach(branch => {
    //   this.showBranches.push({ key: branch.branchName, text: branch.branchName });
    // });
    let inProgressBranch = this.showBranches.find(branch => branch.key === `dev/${this.userAlias}/noCodeDetector/${this.detectorId}`);
    if (!this.branchInput)
      this.displayBranch = inProgressBranch ? inProgressBranch.key : this.mainBranch;
    this.showBranches.push({ key: this.mainBranch, text: this.mainBranch });

    this.diagnosticApiService.getDetectorCode(`${this.detectorId}/package.json`, this.displayBranch, `${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(pkg => {
      console.log(pkg);
      this.buildSavedDetector(pkg);
    });

    if (Object.keys(this.devopsConfig.appTypeReviewers).length > 0 || Object.keys(this.devopsConfig.platformReviewers).length > 0) {
      this.diagnosticApiService.getDetectorCode(`${this.detectorId.toLowerCase()}/owners.txt`, this.mainBranch, `${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(o => {
        this.owners = o.split('\n');
      });
    }
  }

  createStartUp(branches: { branchName: string, isMainBranch: string }[]) {
    var branchRegEx = new RegExp(`dev\/.*\/noCodeDetector\/.*`);
    branches = branches.filter(bn => {
      return branchRegEx.test(bn.branchName);
    });

    this.diagnosticApiService.getDetectors().subscribe(detectors => {
      let idList = detectors.map(detector => detector.id.toLowerCase());
      branches = branches.filter(bn => {
        return !idList.includes(bn.branchName.split("/")[3].toLowerCase());
      });

      this.showBranches = branches.map(branch => {
        return { key: branch.branchName, text: `${branch.branchName.split('/')[1]} : ${branch.branchName.split('/')[3]}` };
      });
    });
  }

  // setBranch(branch: string) {
  //   this.displayBranch = branch;
  // }

  buildSavedDetector(pkgJson: string) {
    this.elements = [];
    const pkg = JSON.parse(pkgJson);
    const parsedDetector = JSON.parse(pkg.NoCodeDetectorJson);
    const savedDetector: NoCodeDetector = new NoCodeDetector();

    savedDetector.id = parsedDetector.Id;
    savedDetector.name = parsedDetector.Name;
    savedDetector.description = parsedDetector.Description;
    savedDetector.author = parsedDetector.Author;
    savedDetector.isInternal = parsedDetector.IsInternal;
    savedDetector.platform = parsedDetector.Platform;
    savedDetector.appType = parsedDetector.AppType;
    savedDetector.stackType = parsedDetector.StackType;
    savedDetector.category = parsedDetector.Category;

    this.detectorName = pkg.name;

    if (!this.detectorSettingsPanelValue) this.detectorSettingsPanelValue = new DetectorSettingsModel(this.resourceService.ArmResource.provider.replace(/[\. ]/g, '_').replace(/[^\w. ]/g, ""), this.resourceService.ArmResource.resourceTypeName.replace(/[\. ]/g, '_').replace(/[^\w. ]/g, ""));
    this.detectorSettingsPanelValue.description = pkg.Description;
    this.detectorSettingsPanelValue.category = pkg.Category;
    this.detectorSettingsPanelValue.isInternalOnly = pkg.IsInternal;
    this.detectorSettingsPanelValue.id = pkg.id;
    this.detectorSettingsPanelValue.type = this.getEntityType(pkg.type);
    this.detectorSettingsPanelValue.authors = [];
    if (pkg.Author)
    pkg.Author.split(",").forEach(a => {
      this.detectorSettingsPanelValue.authors.push(a);
    });
    this.detectorSettingsPanelValue.appTypes = [];
    if (pkg.AppType)
    pkg.AppType.split(",").forEach(a => {
      this.detectorSettingsPanelValue.appTypes.push(SitePropertiesParser.getAppType(a));
    });
    this.detectorSettingsPanelValue.platformTypes = [];
    if (pkg.PlatForm)
    pkg.PlatForm.split(",").forEach(p => {
      this.detectorSettingsPanelValue.platformTypes.push(SitePropertiesParser.getPlatformType(p));
    });
    this.detectorSettingsPanelValue.stackTypes = [];
    if (pkg.StackType)
    pkg.StackType.split(",").forEach(s => {
      this.detectorSettingsPanelValue.stackTypes.push(SitePropertiesParser.getStackType(s));
    });
    this.detectorSettingsPanelValue.analysisList = [];
    if (pkg.AnalysisTypes)
    pkg.AnalysisTypes.forEach(a => {
      let analysistype = <AnalysisPickerModel> {
        id: a
      };
      this.detectorSettingsPanelValue.analysisList.push(analysistype);
    });
    this.detectorSettingsPanelValue.supportTopicList = [];
    if (pkg.SupportTopicList)
    pkg.SupportTopicList.forEach(s => {
      let supportTopic = <SupportTopicPickerModel>{
        supportTopicId: s.Id,
        pesId: s.PesId,
        sapSupportTopicId: s.SapSupportTopicId,
        sapProductId: s.SapProductId
      };
      this.detectorSettingsPanelValue.supportTopicList.push(supportTopic);
    });

    // parsedDetector.Nodes.forEach(n => {
    //   let node = new NoCodeExpressionBody;
    //   node.NodeSettings = n.NodeSettings;
    // });

    savedDetector.nodes = parsedDetector.Nodes;

    savedDetector.nodes.forEach(node => {
      let newNode = new ComposerNodeModel;
      newNode.settings = this.parseNodeSettings(node.NodeSettings);
      newNode.queryName = node.OperationName;
      newNode.code = node.Text;
      this.elements.push(newNode);
    });
  }

  parseNodeSettings(settings){
    let result = new NodeSettings;

    switch (settings.DataSourceSettings.DataSourceType) {
      case "Kusto":
        let kustoSettings = new KustoDataSourceSettings();
        kustoSettings = new KustoDataSourceSettings;
        kustoSettings.dataBaseName = settings.DataSourceSettings.DataBaseName;
        kustoSettings.clusterName = settings.DataSourceSettings.ClusterName;
        result.dataSourceSettings = kustoSettings;
        break;
      default:
        let defaultSettings = new KustoDataSourceSettings();
        defaultSettings = new KustoDataSourceSettings;
        defaultSettings.dataBaseName = settings.DataSourceSettings.DataBaseName;
        defaultSettings.clusterName = settings.DataSourceSettings.ClusterName;
        result.dataSourceSettings = defaultSettings;
        break;
    }

    switch (settings.RenderingSettings.RenderingType) {
      case RenderingType.Table:
        let tableSettings = new NoCodeTableRenderingProperties;
        tableSettings.description = settings.RenderingSettings.Description;
        tableSettings.title = settings.RenderingSettings.Title;
        result.renderingSettings = tableSettings;
        break;
      case RenderingType.TimeSeries:
        let graphSettings = new NoCodeGraphRenderingProperties;
        graphSettings.description = settings.RenderingSettings.Description;
        graphSettings.title = settings.RenderingSettings.Title;
        graphSettings.graphType = settings.RenderingSettings.GraphType;
        graphSettings.graphDefaultValue = settings.RenderingSettings.GraphDefaultValue;
        result.renderingSettings = graphSettings;
        break;
      case RenderingType.Insights:
        let insightSettings = new NoCodeInsightRenderingProperties;
        insightSettings.isExpanded = settings.RenderingSettings.IsExpanded;
        result.renderingSettings = insightSettings;
        break;
      case RenderingType.Markdown:
        let markdownSettings = new NoCodeMarkdownRenderingProperties;
        result.renderingSettings = markdownSettings;
        break;
      default:
        let defaultSettings = new NoCodeTableRenderingProperties;
        defaultSettings.description = settings.RenderingSettings.description;
        defaultSettings.title = settings.RenderingSettings.title;
        result.renderingSettings = defaultSettings;
        break;
    }

    return result;
    //let kustoSettings = new KustoDataSourceSettings();
    
  }

  canExit() : boolean {
    // if (this.detectorDeleted)
    //   return true;
    // else if (!!this.lastSavedVersion && this.code != this.lastSavedVersion)
    //   {
    //     if (confirm("Are you sure you want to leave? You have some unsaved changes.")){
    //       return true;
    //     }
    //     else {
    //       return false;
    //     }
    //   }
    // else {
    //   return true;
    // }
    return true;
  }

  public onBlurDetectorName(event:any):boolean {
    this.detectorSettingsPanelValue.name = this.detectorName;
    this.detectorId = this.detectorSettingsPanelValue.id;
    return true;
  }

  
  public runCompilation():void {
    this.runButtonDisabled = true;
    this.detectorNodes = null;
    this.state = this.executionState.success;
    this.detectorPanelOpenObservable.next(true);
    let det: NoCodeDetector = this.buildNoCodeDetectorObject();

    // let djson = '[';
    // let det: NoCodeDetector = new NoCodeDetector;
    // this.elements.forEach(x => {
    //   let newNode = new NoCodeExpressionBody;
    //   newNode.NodeSettings = x.settings;
    //   newNode.OperationName = x.queryName;
    //   newNode.Text = x.code;
    //   det.nodes.push(newNode);
    //   djson = djson.concat(x.GetJson(),',');
    //   //this.detectorJson.push(x.GetJson());
    // });
    // djson = djson.substring(0, djson.length - 1);
    // djson = djson.concat(']');

    // let djson = '{"nodes":[';
    // let det: NoCodeDetector = new NoCodeDetector;
    // this.elements.forEach(x => {
    //   let newNode = new NoCodeExpressionBody;
    //   newNode.NodeSettings = x.settings;
    //   newNode.OperationName = x.queryName;
    //   newNode.Text = x.code;
    //   det.nodes.push(newNode);
    //   djson = djson.concat(x.GetJson(),',');
    //   //this.detectorJson.push(x.GetJson());
    // });
    // djson = djson.substring(0, djson.length - 1);
    // djson = djson.concat(']}');

    // this.detectorJson = djson;

    det.author = "author";
    det.id = "id";
    det.description = "desc";
    det.name = this.detectorName;
    this.nodeExpressionList = det.nodes;
    //det.nodes = JSON.parse(djson);

    this.diagnosticApiService.executeNoCodeDetector(det, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).subscribe((x: any) => {
      this.detectorNodes = x;
      this.runButtonDisabled = false;
      //this.detectorPanelOpenObservable.next(true);
    },
    error => {
      this.state = this.executionState.failure;
      this.errorMessage = error.error;
      this.runButtonDisabled = false;
      console.log(error);
    });
    console.log(JSON.stringify(this.detectorJson));
    console.log('Run Compilation');
  }

  public saveDetectorCode():void {
    console.log('Save Detector Code');
    var det = this.buildNoCodeDetectorObject();
    let changeType = this.mode == DevelopMode.Create ? 'Add' : 'Edit';
    let comment = this.mode == DevelopMode.Create ? `Adding ${det.id} Author : ${this.userAlias}` : `Editing ${det.id} Author : ${this.userAlias}`;

    this.saveDetector(det, changeType, comment);
  }

  public publishButtonOnClick():void {
    console.log('Publish Button On Click');
    var det = this.buildNoCodeDetectorObject();

    /*this.diagnosticApiService.publishNoCode(pkg).subscribe(x => {
      console.log("subscribe");
    });*/
    let changeType = this.mode == DevelopMode.Create ? 'Add' : 'Edit';
    let comment = this.mode == DevelopMode.Create ? `Adding ${det.id} Author : ${this.userAlias}` : `Editing ${det.id} Author : ${this.userAlias}`;

    this.autoMerge ? this.autoMergePublish(det, changeType, comment) : this.gradPublish(det, changeType, comment);

    // let branch = `dev/${det.author}/noCodeDetector/${det.id}`;
    // let repoPaths = [`${det.id}/metadata.json`];
    // let files = [`{"utterances":[]}`];
    // let comment = "test push detector";
    // let changeType = "Add";
    // let resourceUri = this.resourceService.getCurrentResourceId();
    // this.diagnosticApiService.pushDetectorChanges(branch, files, repoPaths, comment, changeType, resourceUri, det).subscribe(x => {
    //   console.log("subscribe");
    // });
  }

  private gradPublish(det: NoCodeDetector, changeType: string, comment: string = 'pushing changes to detector'): void {
    let branch = `dev/${this.userAlias}/noCodeDetector/${det.id}`;
    let repoPaths = [`/${det.id}/metadata.json`];
    let files = [`{"utterances":[]}`];
    //let comment = "test push detector";
    //let changeType = "Add";
    let resourceUri = this.resourceService.getCurrentResourceId();
    let title = `Publishing ${det.name} detector`;
    let link = `${this.PPEHostname}/${resourceUri}/detectors/${det.id}/nocodeedit?branchInput=${branch}`;
    let description = `This Pull Request was created via AppLens. To make edits, go to ${link}`;

    let reviewers = "";

    if (Object.keys(this.devopsConfig.appTypeReviewers).length > 0 || Object.keys(this.devopsConfig.platformReviewers).length > 0) {
      reviewers = this.addReviewers(det);
      repoPaths.push(`/${det.id.toLowerCase()}/owners.txt`);
      files.push(reviewers);
    }

    const PushDetector = this.diagnosticApiService.pushDetectorChanges(branch, files, repoPaths, comment, changeType, resourceUri, det);
    const MakePullRequest = this.diagnosticApiService.makePullRequest(branch, this.mainBranch, title, resourceUri, this.owners, description);

    PushDetector.subscribe(x => {
      console.log("push");
      MakePullRequest.subscribe(x => {
        console.log("pr");
      });
    });
  }

  private autoMergePublish(det: NoCodeDetector, changeType: string, comment: string = 'pushing changes to detector'): void {
    let repoPaths = [`${det.id}/metadata.json`];
    let files = [`{"utterances":[]}`];
    let resourceUri = this.resourceService.getCurrentResourceId();

    const PushDetector = this.diagnosticApiService.pushDetectorChanges(this.mainBranch, files, repoPaths, comment, changeType, resourceUri, det);

    PushDetector.subscribe(x => {
      console.log("push");
    });
  }

  private saveDetector(det: NoCodeDetector, changeType: string, comment: string = 'pushing changes to detector'): void {
    let branch = `dev/${this.userAlias}/noCodeDetector/${det.id}`;
    let repoPaths = [`/${det.id}/metadata.json`];
    let files = [`{"utterances":[]}`];
    //let comment = "test push detector";
    //let changeType = "Add";
    let resourceUri = this.resourceService.getCurrentResourceId();
    let reviewers = "";

    if (Object.keys(this.devopsConfig.appTypeReviewers).length > 0 || Object.keys(this.devopsConfig.platformReviewers).length > 0) {
      reviewers = this.addReviewers(det);
      repoPaths.push(`/${det.id.toLowerCase()}/owners.txt`);
      files.push(reviewers);
    }

    const PushDetector = this.diagnosticApiService.pushDetectorChanges(branch, files, repoPaths, comment, changeType, resourceUri, det);

    PushDetector.subscribe(x => {
      console.log("push");
    });
  }

  deleteDetector() {
    let branch = `dev/${this.userAlias}/noCodeDetector/${this.detectorId}`;
    let repoPaths = [
      `/${this.detectorId}/metadata.json`,
      `/${this.detectorId}/package.json`,
      `/${this.detectorId}/nocode.json`,
      `/${this.detectorId}/${this.detectorId}.csx`,
    ];
    let files = [
      'delete metadata',
      'delete package',
      'delete nocode json',
      'delete csx'
    ];
    if (Object.keys(this.devopsConfig.appTypeReviewers).length > 0 || Object.keys(this.devopsConfig.platformReviewers).length > 0) {
      repoPaths.push(`/${this.detectorId.toLowerCase()}/owners.txt`);
      files.push('delete owners txt');
    }
    let comment = `Deleting ${this.detectorId} Author : ${this.userAlias}`;
    let changeType = "Delete";
    let resourceUri = this.resourceService.getCurrentResourceId();
    this.diagnosticApiService.pushDetectorChanges(branch, files, repoPaths, comment, changeType, resourceUri).subscribe(x => {
      console.log("subscribe");
    });
  }

  private addReviewers(det: NoCodeDetector): string {
    let reviewers = "";

    det.appType.split(',').forEach(apt => {
      if (Object.keys(this.devopsConfig.appTypeReviewers).includes(apt)) {
        this.devopsConfig.appTypeReviewers[apt].forEach(rev => {
          if (!this.owners.includes(rev)) this.owners.push(rev);
        });
      }
    });

    det.platform.split(',').forEach(plt => {
      if (Object.keys(this.devopsConfig.platformReviewers).includes(plt)) {
        this.devopsConfig.platformReviewers[plt].forEach(rev => {
          if (!this.owners.includes(rev)) this.owners.push(rev);
        });
      }
    });

    this.owners.forEach(o => {
      if (o.match(/^\s*$/) == null) reviewers = reviewers.concat(o, '\n');
    });

    return reviewers;
  }

  private buildNoCodeDetectorObject(): NoCodeDetector {
    var det = new NoCodeDetector();
    // if web app add app plat and stack types
    // also write functions for adding these. looks like theyre enums instead of strings
    if (!!this.detectorSettingsPanelValue.appTypes)
      det.appType = this.getAppTypes();
    if (!!this.detectorSettingsPanelValue.platformTypes)
      det.platform = this.getPlatTypes();
    if (!!this.detectorSettingsPanelValue.stackTypes)
      det.stackType = this.getStackTypes();
    
    det.supportTopics = []
    if (!!this.detectorSettingsPanelValue.supportTopicList)
      this.detectorSettingsPanelValue.supportTopicList.forEach(x => {
        det.supportTopics.push(new SupportTopic(x));
      });
    if (!!this.detectorSettingsPanelValue.analysisList)
      det.analysisTypes = this.detectorSettingsPanelValue.analysisList.map(x => x.id);

      this.elements.forEach(x => {
        let newNode = new NoCodeExpressionBody;
        newNode.NodeSettings = x.settings;
        newNode.OperationName = x.queryName;
        newNode.Text = x.code;
        det.nodes.push(newNode);
        //this.detectorJson.push(x.GetJson());
      });

    det.id = this.detectorId;
    //det.nodes = this.nodeExpressionList;
    det.author = this.detectorSettingsPanelValue.authors.join(",");
    det.name = this.detectorName;
    det.description = this.detectorSettingsPanelValue.description;
    det.category = this.detectorSettingsPanelValue.category;
    det.isInternal = this.detectorSettingsPanelValue.isInternalOnly;
    
    return det;
  }

  private getAppTypes(): string {
    let apptypes = [];
    this.detectorSettingsPanelValue.appTypes.forEach(x => {
      apptypes.push(SitePropertiesParser.getDisplayForAppType(x));
    });
    return apptypes.join(",");
  }

  private getPlatTypes(): string {
    let plattypes = [];
    this.detectorSettingsPanelValue.platformTypes.forEach(x => {
      plattypes.push(SitePropertiesParser.getDisplayForPlatformType(x));
    });
    return plattypes.join(",");
  }

  private getStackTypes(): string {
    let stacktypes = [];
    this.detectorSettingsPanelValue.stackTypes.forEach(x => {
      stacktypes.push(SitePropertiesParser.getDisplayForStackType(x));
    });
    return stacktypes.join(",");
  }

  private getEntityType(value: string): EntityType {
      switch (value.toLowerCase()) {
        case 'analysis':
          return EntityType.Analysis;
        case 'detector':
          return EntityType.Detector;
        default:
          return undefined;
      }
    }

  public getRequiredErrorMessageOnTextField(value: string): string {
    if (!value) {
      return ' Value cannot be empty';
    };
  }

  //#region Detector Settings Panel Methods

  // public detectorSettingsButtonOnClick():void {
  //   this.detectorSettingsPanelOpenState = true;
  //   console.log('Detector Settings Button On Click');
  // }

  public detectorSettingsButtonOnClick():void {
    this.detectorSettingsPanelOpenState = true;
    console.log('Detector Settings-1 Button On Click');
  }

  public detectorSettingsPanelOnDismiss(dismissAction:string):void {
    if(!this.detectorSettingsPanelOpenState) {
      //this.detectorSettingsPanelOpenState = false;
      console.log('Detector Settings Panel On Dismiss : ' + dismissAction  + ' ' + window.performance.now().toString());
    }
  }  

  
  
  
  //#endregion Detector Settings Panel Methods

  public detectorSettingsPanelOnOpened():void {
    console.log('Detector Settings Panel On Opened');
    this.notifyPanelCloseSubject.take(1).subscribe((dismissAction) => {
      this.detectorSettingsPanelOnDismiss(dismissAction);
    });
  }

  public onOpenedDetectorSettingsPanel():void {
    //console.log('Parent : Detector Settings1 Panel OnOpened: ' + window.performance.now().toString());
  }

  public onDismissDetectorSettingsPanel(source:string) {
    console.log('Parent : Detector Settings1 Panel OnClosed: Source=' + source + ' ' + window.performance.now().toString());    
    console.log(this.detectorSettingsPanelValue);
  }

  public onChangeDetectorName(e: {event: Event, newValue?: string}) {
    this.detectorName = e.newValue;
    let cursorStartPosition:number = -1;

    if(e && e.event && e.event.target && e.event.target['selectionStart']) {

      cursorStartPosition = e.event.target['selectionStart'];

    }

    if(cursorStartPosition > -1) {

      setTimeout(() => {

        e.event.target['selectionStart'] = cursorStartPosition;

        e.event.target['selectionEnd'] = cursorStartPosition;

      });

    }
  }


  public getAttention(elementId:string):void {
    setTimeout(() => {
      document.getElementById(elementId).scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
      let originalClasses:string = document.getElementById(elementId).className;
      document.getElementById(elementId).className = originalClasses + ' ripplePrimary';
      setTimeout(() => {
        document.getElementById(elementId).className = originalClasses;
      }, 1000);
    }, 100);
  }

  public moveElementUp(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    this.elements.splice(currentIndex-1, 0, currentElement); //Add the element to its new position
    this.elements.splice(currentIndex+1, 1); //Remove the element from its current position
    this.getAttention(currentElement.id + '_rowContainer');
  }

  public moveElementDown(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    this.elements.splice(currentIndex+2, 0, currentElement); //Add the element to its new position
    this.elements.splice(currentIndex, 1); //Remove the element from its current position
    this.getAttention(currentElement.id + '_rowContainer');
  }

  public addElement() {
    let newElement:ComposerNodeModel = new ComposerNodeModel();
    this.elements.push(newElement);
  }
  
  public deleteElement(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    this.elements.splice(currentIndex, 1);
  }

  public duplicateElement(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    let newElement:ComposerNodeModel = ComposerNodeModel.CreateNewFrom(currentElement);
    this.elements.splice(currentIndex+1, 0, newElement);
    this.getAttention(newElement.id + '_rowContainer');
  }

  public reflectModelChanges(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    currentElement = event;
  }

  public onComposerElementChange(currentElement:ComposerNodeModel, currentIndex:number, event:INodeModelChangeEventProps) { 
  }



  branchToggleCallout() {
    if (!this.branchButtonDisabled) {
      this.isBranchCallOutVisible = !this.isBranchCallOutVisible;
    }
  }

  noBranchesAvailable() {
    this.displayBranch = "NA (not published)";
    this.disableBranchButton();
  }

  disableBranchButton() {
    this.branchButtonDisabled = true;
    this.pillButtonStyleBranchPicker = {
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

  jsonToNodeExpression(jsonString: string){
    let nodeList: NoCodeExpressionBody[] = JSON.parse(jsonString);
    return nodeList;
  }

  closeBranchCallout() {
    this.isBranchCallOutVisible = false;
  }

  updateTempBranch(event: any) {
    this.tempBranch = event.option.key;
  }

  updateBranch() {
    console.log("Update Branch");
    this.displayBranch = this.tempBranch;
    if (this.tempBranch != this.mainBranch) {
      this.detectorId = this.tempBranch.split('/')[3];
    }
    this.detectorLoaded = false;
    this.diagnosticApiService.getDetectorCode(`${this.detectorId}/package.json`, this.displayBranch, `${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(pkg => {
      console.log(pkg);
      this.buildSavedDetector(pkg);
      this.mode = DevelopMode.Edit;
      this.closeBranchCallout();
      this.detectorLoaded = true;
    });
  }

  ngOnDestroy() {
    this._router.navigate([], {
      queryParams: {
        'branchInput': null,
      },
      queryParamsHandling: 'merge'
    });
  }
}


