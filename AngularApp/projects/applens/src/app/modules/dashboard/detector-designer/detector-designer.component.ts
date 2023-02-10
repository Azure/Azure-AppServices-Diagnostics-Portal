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
import { DetectorSettingsModel } from '../models/detector-designer-models/detector-settings-models';
import { ComposerNodeModel } from '../models/detector-designer-models/node-models';
import { Guid } from 'projects/diagnostic-data/src/lib/utilities/guid';


@Component({
  selector: 'detector-designer',
  templateUrl: './detector-designer.component.html',
  styleUrls: ['./detector-designer.component.scss']
})

export class DetectorDesigner implements OnInit, IDeactivateComponent  {
  @Input() mode: DevelopMode = DevelopMode.Create;

  detectorName:string = 'Settings Panel Name';//'Auto Generated Detector Name';

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
  detectorGraduation: boolean = false;
  isBranchCallOutVisible: boolean = false;
  branchButtonDisabled: boolean = false;
  showBranches: IChoiceGroupOption[] = [{key: "", text: ""}];
  displayBranch: string = "";
  tempBranch: string = "";
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
  //#endregion Graduation branch picker variables

  //#region Time picker variables
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  timePickerButtonStr: string = "";
  pillButtonStyleTimePicker: IButtonStyles = {
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
  //#region Time picker variables

  //#region Detector settings panel variables
  detectorId:string = '';  
  //#endregion Detector settings panel variables

  initialized: boolean = false;  

  resetSettingsPanel(): void {
    this.detectorSettingsPanelValue = new DetectorSettingsModel(this.resourceService.ArmResource.provider, this.resourceService.ArmResource.resourceTypeName);
    this.detectorSettingsPanelValue.name = this.detectorName;
    this.detectorId = this.detectorSettingsPanelValue.id;

    //Take this out, this is for testing
    this.detectorSettingsPanelValue.isPrivate = true;
    this.detectorSettingsPanelValue.description = 'This is a test description';
  
    if(this.detectorSettingsPanelValue.isAppService) {
      //TODO: Initialize this with whatever the detector is currently set to.
    } else {
    }

  }

  resetGlobals(): void {
    this.detectorName = 'detectorName';//'Auto Generated Detector Name';
    this.resetSettingsPanel();
    this.initMonacoEditorOptions();
    this.resetComposerNodes();
  }
  public resetComposerNodes(): void {
    this.renderingTypeOptions = [
      {
        key: RenderingType.Table,
        text:'Table',
        selected: false,
        index: 0,
        itemType: SelectableOptionMenuItemType.Normal
      },
      {
        key: RenderingType.Insights,
        text:'Insight',
        selected: false,
        index: 1,
        itemType: SelectableOptionMenuItemType.Normal
      },
      {
        key:RenderingType.TimeSeries,
        text:'Graph',
        selected: false,
        index: 2,
        itemType: SelectableOptionMenuItemType.Normal
      },
      {
        key: RenderingType.Markdown,
        text:'Markdown',
        selected: false,
        index: 3,
        itemType: SelectableOptionMenuItemType.Normal
      }
    ];    
  }

  initMonacoEditorOptions(): void {
    this.lightOptions = {
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

    this.darkOptions = {
      theme: 'vs-dark',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true
    };

    this.editorOptions = this.lightOptions;
  }

  //#region Element composer
  elements:ComposerNodeModel[] = [
    {
      id: Guid.newGuid(),
      queryName: 'firstQuery',
      code:'',
      renderingType:RenderingType.Table
    },
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
    }];

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
    renderingTypeOptions:IDropdownOption[] = [];

    //#region Pivot variables
    pivotStyle: IPivotProps['styles'] = {      
    }

    //#region Monaco editor variables
    editorOptions: any;
    lightOptions: any;
    darkOptions: any;
    //#endregion Monaco editor variables

    //#endregion Pivot variables
  //#endregion Element composer


  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService, private detectorGistApiService: DetectorGistApiService,
    public diagnosticApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService,
    public ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService, private _activatedRoute: ActivatedRoute,
    private _applensCommandBarService: ApplensCommandBarService, private _router: Router, private _themeService: GenericThemeService, private _applensGlobal: ApplensGlobal ) {
    this._applensGlobal.updateHeader('');
    
    this.resetGlobals();
  }

  ngOnInit() {
    this._activatedRoute.params.subscribe((params: Params) => {
      this.initialized = false;
      this._detectorControlService.timePickerStrSub.subscribe(s => {
        this.timePickerButtonStr = s;
      });
      this.startUp();
    });
  }

  startUp(){
    this.detectorGraduation = true;
    
    this.diagnosticApiService.getDevopsConfig(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(devopsConfig => {
      this.noBranchesAvailable();
      this.detectorGraduation = devopsConfig.graduationEnabled;
    });
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
    console.log('Run Compilation');
  }

  public saveDetectorCode():void {
    console.log('Save Detector Code');
  }

  public publishButtonOnClick():void {
    console.log('Publish Button On Click');
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

  public removeSpacesFromQueryName(currentElement:ComposerNodeModel, event:any):void {
    currentElement.queryName = currentElement.queryName.replace(/(\b|_|-)\s?(\w)/g, (c) => {return c.replace(/[\s|_|-]/g, '').toUpperCase();} )
  }

  public getAttention(elementId:string):void {
    setTimeout(() => {
      document.getElementById(elementId).scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
      let originalClasses:string = document.getElementById(elementId).className;
      document.getElementById(elementId).className = originalClasses + ' ripple';
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

  public previewResults(currentElement:ComposerNodeModel, currentIndex:number, event:any):void {
    console.log('Preview Results');
    console.log(event);
  }

  public deleteElement(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    this.elements.splice(currentIndex, 1);
  }

  public duplicateElement(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    let newElement:ComposerNodeModel = ComposerNodeModel.CreateFrom(currentElement);
    this.elements.splice(currentIndex+1, 0, newElement);
    this.getAttention(newElement.id + '_rowContainer');
  }

  public onRenderingTypeChange(currentElement:ComposerNodeModel, currentIndex:number, event:any) {
    console.log('Rendering Type Changed');
    console.log(event);
    //let key:string = event.option.key.toString();
    currentElement.renderingType = event.option.key;
  }

  public setMocanoReference(currentElement:ComposerNodeModel, currentIndex:number, editor:any) {
    currentElement.editorRef = editor;
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

  closeBranchCallout() {
    this.isBranchCallOutVisible = false;
  }

  updateTempBranch(event: any) {
    this.tempBranch = event.option.key;
  }

  updateBranch() {
    console.log("Update Branch");
    this.closeBranchCallout();
  }
}


