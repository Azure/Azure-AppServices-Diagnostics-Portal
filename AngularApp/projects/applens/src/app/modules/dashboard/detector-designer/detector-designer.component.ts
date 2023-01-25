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
import { DetectorControlService, DetectorMetaData, DetectorType, GenericThemeService, TelemetryService } from 'diagnostic-data';
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


@Component({
  selector: 'detector-designer',
  templateUrl: './detector-designer.component.html',
  styleUrls: ['./detector-designer.component.scss']
})

export class DetectorDesigner implements OnInit, IDeactivateComponent  {
  @Input() mode: DevelopMode = DevelopMode.Create;

  // Had to add this to make the people picker work.
  // People picker component has a bug. https://github.com/microsoft/angular-react/issues/213
  public static applensDiagnosticApiService: ApplensDiagnosticService;
  public static applensResourceService:ResourceService;

  detectorName:string = 'Auto Generated Detector Name';

  PanelType = PanelType;

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
    wrapper: {
      display: 'flex',
    },
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
  detectorSettingsButtonText:string = 'Settings';
  settingsIcon: any = { iconName: 'Settings' };
  detectorSettingsPanelOpenState: boolean = false;
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

  detectorType: string = '';
  detectorTypeOptions: IDropdownOption[] = [];

    //#region DetectorAuthor settings
      detectorAuthorPickerInputProps: IBasePickerProps<IPersona>["inputProps"] = {
        "aria-label": "Detector author picker",
        spellCheck: false
      };
      loggedInUserId: string = '';

      detectorAuthorIds: IPersonaProps[] = [];
      detectorAuthorPickerSelectedItems: IPersonaProps[] = [];
    //#endregion DetectorAuthor settings
    
    detectorDescription: string = '';

    //#region Category picker settings
      detectorCategoryPickerInputProps: IBasePickerProps<ITagPickerProps>["inputProps"] = {
        "aria-label": "picker for assign category ",
        spellCheck: true,
        autoComplete: "off"      
      }
      detectorCategoryPickerSelectedItems: IBasePickerProps<ITagItemProps>[];
    //#endregion Category picker settings

    //#region AppType dropdown settings
      effectiveResourceAppType:AppType[] = [];
      resourceAppTypeRequiredErrorMessage:string = '';
      resourceAppTypeOptions: IDropdownOption[] = [];
      resourceAppTypeOptionsDefaultSelectedKeys: string[] = [];
    //#endregion AppType dropdown settings

    //#region PlatformType dropdown settings
      effectiveResourcePlatformType:PlatformType[] = [];
      resourcePlatformTypeRequiredErrorMessage:string = '';
      resourcePlatformTypeOptions: IDropdownOption[] = [];
      resourcePlatformTypeOptionsDefaultSelectedKeys: string[] = [];
    //#endregion PlatformType dropdown settings

    //#region StackType dropdown settings
      effectiveResourceStackType:StackType[] = [];
      resourceStackTypeRequiredErrorMessage:string = '';
      resourceStackTypeOptions: IDropdownOption[] = [];
      resourceStackTypeOptionsDefaultSelectedKeys: string[] = [];
    //#endregion StackType dropdown settings

    isInternalOnly:boolean = true;
    isDetectorPrivate:boolean = false;
    isOnDemandRenderEnabled:boolean = false;

    //#region Analysis picker settings
      detectorAnalysisPickerInputProps: IBasePickerProps<ITagPickerProps>["inputProps"] = {
        "aria-label": "Picker for link to analysis",
        spellCheck: true,
        autoComplete: "off"      
      }
      detectorAnalysisPickerSelectedItems: IBasePickerProps<ITagItemProps>[];
    //#endregion Analysis picker settings

    //#region SupportTopic picker settings
      supportTopicPickerInputProps: IBasePickerProps<ITagPickerProps>["inputProps"] = {
        "aria-label": "Picker for link to support topic",
        spellCheck: true,
        autoComplete: "off"      
      }
      supportTopicPickerSelectedItems: IBasePickerProps<ITagItemProps>[];
    //#endregion SupportTopic picker settings
  
  //#endregion Detector settings panel variables

  initialized: boolean = false;


  public getUserPersonaInfoFromAlias(alias:string):Observable<IPersonaProps> {
    let userInfo = this.diagnosticApiService.getUserInfo(alias).map(userInfo => {return (userInfo && userInfo.displayName)? userInfo.displayName : ''});
    let userImage = this.diagnosticApiService.getUserPhoto(alias).map(image => {return image});

    return forkJoin([userInfo, userImage]).pipe(mergeMap(results =>{
      return of(<IPersonaProps>{
        text: alias,
        secondaryText:results[0]? results[0] : alias,
        imageUrl: results[1],
        showSecondaryText:false,
        showInitialsUntilImageLoads: true
      });
    }));
  }

  public updateDetectorAuthorIdsWithNewState(newItemsState:IPersonaProps[]): void {
    if(newItemsState.length > 0) {
      newItemsState.forEach(item => {
        item.text = item.text.toLowerCase();
      });

      // Remove items not present in the new state
      this.detectorAuthorIds = this.detectorAuthorIds.filter(existingAuthor => newItemsState.some(newAuthor => newAuthor.text == existingAuthor.text));

      // Do not add the items that are already present in the list, only add the new ones.
      this.detectorAuthorIds.push(...newItemsState.filter(item => !this.detectorAuthorIds.some(detectorAuthor => detectorAuthor.text == item.text)));

      // Update the selected items even though we do not have image and user name.
      // Those details will be fetched in the background.
      this.detectorAuthorPickerSelectedItems = [];
      this.detectorAuthorPickerSelectedItems.push(...this.detectorAuthorIds);

      // Start fetching the user persona info in the background
      let userPersonaTasks:Observable<IPersonaProps>[] = [];
      this.detectorAuthorIds.forEach(detectorAuthor => {
        if(!detectorAuthor.imageUrl || detectorAuthor.text == detectorAuthor.secondaryText) {
          userPersonaTasks.push(this.getUserPersonaInfoFromAlias(detectorAuthor.text));
        }
      });

      //Wait for all the user persona info to be fetched and update the detectorAuthorIds
      forkJoin(userPersonaTasks).subscribe(userPersonaInfos => {
        userPersonaInfos.forEach(userPersonaInfo => {
          let itemToUpdate = this.detectorAuthorIds.findIndex(detectorAuthor => detectorAuthor.text === userPersonaInfo.text);
          if(itemToUpdate > -1) {
            this.detectorAuthorIds[itemToUpdate] = userPersonaInfo;
          }
        });
      },
      ()=> {/* Ignore errors*/},
      () => {
        //ForkJoin complete. Update the detectorAuthorPickerSelectedItems now that we have the user persona info in detectorAuthorIds
        this.detectorAuthorPickerSelectedItems = this.detectorAuthorIds;
      });
    }
  }

  resetSettingsPanel(): void {
    this.detectorId = this.getDetectorId();

    //#region DetectorId dropdown options
    this.detectorTypeOptions = [
      {
        key: 'Analysis',
        text: 'Analysis',
        selected: false,
        index: 0,
        itemType:SelectableOptionMenuItemType.Normal
      },
      {
        key: 'Detector',
        text: 'Detector',
        selected: true,
        index: 1,
        itemType:SelectableOptionMenuItemType.Normal
      }
    ];
    this.detectorType = 'Detector';
    //#endregion DetectorId dropdown options

    //#region Detector Author and logged in users details
    
    let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : this._adalService.userInfo.userName;
    this.loggedInUserId = alias.replace('@microsoft.com', '');

    this.detectorAuthorIds = [];
    //TODO: This is temporary. Initialize author id from detector metadata.
    //User ids can be comma or semi-colon separated.
    let authorIds:IPersonaProps[] = [];


    //Push logged-in user's detail
    this.detectorAuthorIds.push({
      text: `${this.loggedInUserId}`,
      secondaryText: `${(this._adalService.userInfo.profile ? this._adalService.userInfo.profile.name : this._adalService.userInfo.userName)}`,
      showSecondaryText:false,
      imageUrl: undefined,
      showInitialsUntilImageLoads: true
    });
    // this.detectorAuthorIds.push({
    //   text: `puneetg`,
    //   secondaryText: `Punet Gupta`,
    //   showSecondaryText:false,
    //   imageUrl: undefined,
    //   showInitialsUntilImageLoads: true
    // });
    
    // This will initialize the detector author picker so that the user experience is smooth.
    // We will update author details in the background.
    this.updateDetectorAuthorIdsWithNewState(this.detectorAuthorIds);


    //#endregion Detector Author and logged in users details
    if(this.isAppService) {
      //TODO: Initialize this with whatever the detector is currently set to.
      //#region resourceAppTypeOptions, resourcePlatformTypeOptions and resourceStackTypeOptions dropdown options
      this.resourceAppTypeOptionsDefaultSelectedKeys = [SitePropertiesParser.getDisplayForAppType(AppType.All) ];      

      let optionIndex = 0;

      this.resourceAppTypeOptions = [<IDropdownOption>{
        key: SitePropertiesParser.getDisplayForAppType(AppType.All),
        text: SitePropertiesParser.getDisplayForAppType(AppType.All),
        selected: this.resourceAppTypeOptionsDefaultSelectedKeys.some(key => key === SitePropertiesParser.getDisplayForAppType(AppType.All)),
        index: optionIndex++
      }];

      // Iterate through the enum and add the options
      for (let appType in AppType) {
        if(isNaN(Number(appType)) && !this.resourceAppTypeOptions.some(option => option.key === appType) ) {
          this.resourceAppTypeOptions.push(<IDropdownOption>{
            key: appType,
            text: appType,
            selected: this.resourceAppTypeOptionsDefaultSelectedKeys.some(key => key === appType),
            index: optionIndex++
          });
        }
      }
      //#endregion resourceAppTypeOptions dropdown options

      //#region resourcePlatformTypeOptions dropdown options
      this.resourcePlatformTypeOptionsDefaultSelectedKeys = [SitePropertiesParser.getDisplayForPlatformType(PlatformType.All) ];
      optionIndex = 0;
      this.resourcePlatformTypeOptions = [<IDropdownOption>{
        key: SitePropertiesParser.getDisplayForPlatformType(PlatformType.All),
        text: SitePropertiesParser.getDisplayForPlatformType(PlatformType.All),
        selected: this.resourcePlatformTypeOptionsDefaultSelectedKeys.some(key => key === SitePropertiesParser.getDisplayForPlatformType(PlatformType.All)),
        index: optionIndex++
      }];

      // Iterate through the enum and add the options
      for (let platformType in PlatformType) {
        if(isNaN(Number(platformType)) && !this.resourcePlatformTypeOptions.some(option => option.key === platformType) ) {
          this.resourcePlatformTypeOptions.push(<IDropdownOption>{
            key: platformType,
            text: platformType,
            selected: this.resourcePlatformTypeOptionsDefaultSelectedKeys.some(key => key === platformType),
            index: optionIndex++
          });
        }
      }
      //#endregion resourcePlatformTypeOptions dropdown options

      //#region resourceStackTypeOptions dropdown options
      this.resourceStackTypeOptionsDefaultSelectedKeys = [SitePropertiesParser.getDisplayForStackType(StackType.All) ];
      optionIndex = 0;
      this.resourceStackTypeOptions = [<IDropdownOption>{
        key: SitePropertiesParser.getDisplayForStackType(StackType.All),
        text: SitePropertiesParser.getDisplayForStackType(StackType.All),
        selected: this.resourceStackTypeOptionsDefaultSelectedKeys.some(key => key === SitePropertiesParser.getDisplayForStackType(StackType.All)),
        index: optionIndex++
      }];

      // Iterate through the enum and add the options
      for (let stackType in StackType) {
        if(isNaN(Number(stackType)) && !this.resourceStackTypeOptions.some(option => option.key === stackType) ) {
          this.resourceStackTypeOptions.push(<IDropdownOption>{
            key: stackType,
            text: stackType,
            selected: this.resourceStackTypeOptionsDefaultSelectedKeys.some(key => key === stackType),
            index: optionIndex++
          });
        }
      }
      //#endregion resourceStackTypeOptions dropdown options

    } else {
      this.resourceAppTypeOptions = [];
      this.resourcePlatformTypeOptions = [];
      this.resourceStackTypeOptions = [];
    }

    this.handleResourceAppTypeOptions();
    this.handleResourcePlatformTypeOptions();
    this.handleResourceStackTypeOptions();

    this.isInternalOnly = true;

  }

  resetGlobals(): void {
    this.detectorName = 'Auto Generated Detector Name';
    this.resetSettingsPanel();
  }


  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService, private detectorGistApiService: DetectorGistApiService,
    public diagnosticApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService,
    public ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService, private _activatedRoute: ActivatedRoute,
    private _applensCommandBarService: ApplensCommandBarService, private _router: Router, private _themeService: GenericThemeService, private _applensGlobal: ApplensGlobal ) {
    this._applensGlobal.updateHeader('');
    DetectorDesigner.applensDiagnosticApiService = this.diagnosticApiService;
    DetectorDesigner.applensResourceService = this.resourceService;
    
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

  public get isAppService():boolean {
    return this.resourceService.ArmResource.provider.toLowerCase() === 'microsoft.web' && this.resourceService.ArmResource.resourceTypeName.toLowerCase() === 'sites';
  }

  public getDetectorId():string {
    return this.resourceService.ArmResource.provider + '_' + this.resourceService.ArmResource.resourceTypeName + '_' + this.detectorName.replace(/\s/g,'_',).replace(/\./g, '_');
  }

  public onBlurDetectorName(event:any):boolean {
    this.detectorId = this.getDetectorId();
    return false;
  }

  public getRequiredErrorMessageOnTextField(value: string): string {
    if(value == null || value == undefined || value == '') {
      return 'Value cannot be empty';
    };
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

  //#region Detector Settings Panel Methods

  public detectorSettingsButtonOnClick():void {
    this.detectorSettingsPanelOpenState = true;
    console.log('Detector Settings Button On Click');
  }

  public detectorSettingsPanelOnDismiss(dismissAction:string):void {
    if(this.detectorSettingsPanelOpenState) {
      this.detectorSettingsPanelOpenState = false;
      console.log('Detector Settings Panel On Dismiss : ' + dismissAction  + ' ' + window.performance.now().toString());
    }
  }

  public onChangeDetectorType(event: any):void {
    this.detectorType = event.option.key.toString();
  }

  //#region Detector Author Picker Methods

  public updateDetectorAuthorSelectedItems(event:any):boolean {
    //this.detectorAuthorIds = event.items;    
    this.updateDetectorAuthorIdsWithNewState(event.items);
    return false;
  }

  public detectorAuthorPickerInputChanged():any {
    const _this = this;
    return (data) => {
      return _this.detectorAuthorPickerInputChangedClosureImpl(data, _this);
    }
  }

  public detectorAuthorPickerInputChangedClosureImpl(data: any, thisPointer?:any):IPersonaProps[] | Promise<IPersonaProps[]> {
    //Issue: https://github.com/microsoft/angular-react/issues/213
    if(data) {
        //return thisPointer.diagnosticApiService.getSuggestionForAlias(data).map(response => {
        return DetectorDesigner.applensDiagnosticApiService.getSuggestionForAlias(data).map(response => {  
        let suggestions: IPersonaProps[] = [];
        response.forEach(suggestion => {
          if(suggestion && suggestion.userPrincipalName)
          suggestions.push({
            text: `${suggestion.userPrincipalName.toLowerCase().replace('@microsoft.com', '')}`,
            secondaryText: `${suggestion.userPrincipalName.toLowerCase().replace('@microsoft.com', '')}`,
            showSecondaryText:false,
            imageUrl: undefined,
            showInitialsUntilImageLoads: true
          });
        });
        return suggestions.slice(0, 5);
      }).toPromise();
    }
    else {
      return [];
    }

        
    // Testing with static values and delaying the rendering by 250 ms
    // const results:IPersonaProps[] = [{
    //   text:data,
    //   secondaryText:data,
    //   showSecondaryText:false,
    //   imageUrl: undefined,
    //   showInitialsUntilImageLoads: false
    // }];
    
    // return new Promise<IPersonaProps[]>((resolve, reject) => setTimeout(
    //   () => resolve(results)
    //   , 250));

  }
  //#endregion Detector Author Picker Methods

  //#region Detector Category Picker Methods
  public updateDetectorCategorySelectedItems(event:any):boolean {
    console.log('updateDetectorCategorySelectedItems');
    console.log(event);    
    this.detectorCategoryPickerSelectedItems = event.items;
    return false;
  }

  public detectorCategoryPickerInputChanged():any {
    const _this = this;
    return (data): ITagItemProps[] | Promise<ITagItemProps[]> => {
      return _this.detectorCategoryPickerInputChangedClosureImpl(data, _this);
    }
  }

  public detectorCategoryPickerInputChangedClosureImpl(data: any, thisPointer?:DetectorDesigner): ITagItemProps[] | Promise<ITagItemProps[]>{
    return DetectorDesigner.applensDiagnosticApiService.getDetectors().map<DetectorMetaData[], ITagItemProps[]>(response => {
    //return thisPointer.diagnosticApiService.getDetectors().map<DetectorMetaData[], ITagItemProps[]>(response => {
      const categories:string[] = Array.from(new Set(response.filter(detector=> detector.category && detector.category.toLowerCase().indexOf(data.toLowerCase()) > -1)
      .map(detectorsWithCategory => detectorsWithCategory.category)));
      
      categories.sort();

      let tagSuggestions:ITagItemProps[] = [];
      let tagIndex = 0;
      tagSuggestions = categories.map<ITagItemProps>(category => <ITagItemProps>{
        index:tagIndex++,
        item:{
          key:category,
          name:category
        }
      });

      //Adds the current input string as a suggestion if it is not already present in the list
      if(data && !tagSuggestions.some(item=>item.item.key.toString().toLowerCase() == data.toString().toLowerCase())) {
        tagSuggestions.push(<ITagItemProps>{
          index:tagIndex++,
          item:{
            key:data,
            name:data
          }
        });
      }
      return tagSuggestions.slice(0, 5);
    }).toPromise();
  }

  // public detectorCategoryPickerValidateInput(input: string): ValidationState {
  //   if(input) {
  //     return ValidationState.valid;
  //   }
  //   else {
  //     return ValidationState.invalid;
  //   }
  // }
  
  //#endregion Detector Category Picker Methods
  
  //#region Detector App Type dropdown Methods
  public handleResourceAppTypeOptions(selectedOption?: any):void {
    //Due to a bug in multiselect mode for dropdowns where the changes in model is not passed on to the callout that displays the optionson UI, we cannot have the UI reflect the same state as the model.
    //Do not try to uncheck/check stuff based on AppType.All, merely maintain the state of the model as reflected in the UI.

    this.resourceAppTypeRequiredErrorMessage = '';
    
    if(this.resourceAppTypeOptions.length > 0) {
      if(selectedOption) {
        // This ensures that the model is updated with the latest state of the UI
        this.resourceAppTypeOptions[this.resourceAppTypeOptions.findIndex(option=> option.key === selectedOption.key)].selected = selectedOption.selected;
      }
      
      //Determine the effective resource app type
      if(this.resourceAppTypeOptions.find(option=> option.key === SitePropertiesParser.getDisplayForAppType(AppType.All)).selected === true) {
        this.effectiveResourceAppType = [AppType.All];
      }
      else {
        this.effectiveResourceAppType = this.resourceAppTypeOptions.filter(option=> option.selected).map(option=> AppType[option.key] as AppType);
      }

      this.resourceAppTypeRequiredErrorMessage = this.effectiveResourceAppType.length === 0 && this.resourceAppTypeOptions.length > 0 ? 'At least one App type is required' : '';    }
    else {
      this.effectiveResourceAppType = [];
    }

  }

  public onChangeResourceAppType(event: any):void {
    this.handleResourceAppTypeOptions(event.option);    
  }
  //#endregion Detector App Type dropdown Methods

  //#region Detector Platform Type dropdown Methods
  public handleResourcePlatformTypeOptions(selectedOption?: any):void {
    //Due to a bug in multiselect mode for dropdowns where the changes in model is not passed on to the callout that displays the optionson UI, we cannot have the UI reflect the same state as the model.
    //Do not try to uncheck/check stuff based on AppType.All, merely maintain the state of the model as reflected in the UI.

    this.resourcePlatformTypeRequiredErrorMessage = '';
    
    if(this.resourcePlatformTypeOptions.length > 0) {
      if(selectedOption) {
        // This ensures that the model is updated with the latest state of the UI
        this.resourcePlatformTypeOptions[this.resourcePlatformTypeOptions.findIndex(option=> option.key === selectedOption.key)].selected = selectedOption.selected;
      }
      
      //Determine the effective resource app type
      if(this.resourcePlatformTypeOptions.find(option=> option.key === SitePropertiesParser.getDisplayForPlatformType(PlatformType.All)).selected === true) {
        this.effectiveResourcePlatformType = [PlatformType.All];
      }
      else {
        this.effectiveResourcePlatformType = this.resourcePlatformTypeOptions.filter(option=> option.selected).map(option=> PlatformType[option.key] as PlatformType);
      }

      this.resourcePlatformTypeRequiredErrorMessage = this.effectiveResourcePlatformType.length === 0 && this.resourcePlatformTypeOptions.length > 0 ? 'At least one Platform type is required' : '';    }
    else {
      this.effectiveResourcePlatformType = [];
    }
  }

  public onChangeResourcePlatformType(event: any):void {
    this.handleResourcePlatformTypeOptions(event.option);    
  }
  //#endregion Detector Platform Type dropdown Methods

  //#region Detector Stack Type dropdown Methods
  public handleResourceStackTypeOptions(selectedOption?: any):void {
    //Due to a bug in multiselect mode for dropdowns where the changes in model is not passed on to the callout that displays the optionson UI, we cannot have the UI reflect the same state as the model.
    //Do not try to uncheck/check stuff based on AppType.All, merely maintain the state of the model as reflected in the UI.

    this.resourceStackTypeRequiredErrorMessage = '';
    
    if(this.resourceStackTypeOptions.length > 0) {
      if(selectedOption) {
        // This ensures that the model is updated with the latest state of the UI
        this.resourceStackTypeOptions[this.resourceStackTypeOptions.findIndex(option=> option.key === selectedOption.key)].selected = selectedOption.selected;
      }
      
      //Determine the effective resource app type
      if(this.resourceStackTypeOptions.find(option=> option.key === SitePropertiesParser.getDisplayForStackType(StackType.All)).selected === true) {
        this.effectiveResourceStackType = [StackType.All];
      }
      else {
        this.effectiveResourceStackType = this.resourceStackTypeOptions.filter(option=> option.selected).map(option=> StackType[option.key] as StackType);
      }

      this.resourceStackTypeRequiredErrorMessage = this.effectiveResourceStackType.length === 0 && this.resourceStackTypeOptions.length > 0 ? 'At least one Stack type is required' : '';    }
    else {
      this.effectiveResourceStackType = [];
    }
  }

  public onChangeResourceStackType(event: any):void {
    this.handleResourceStackTypeOptions(event.option);    
  }
  //#endregion Detector Stack Type dropdown Methods

  //#region isInternalOnly Methods
  public getInternalOnlyCheckStatus(): boolean {
    return this.isInternalOnly;
  }

  public toggleInternalOnlyState(checked: boolean) {
    this.isInternalOnly = checked;
  }
  //#endregion isInternalOnly Methods

  //#region getPrivateCheckStatus Methods
  public getDetectorPrivateCheckStatus(): boolean {
    return this.isDetectorPrivate;
  }

  public toggleDetectorPrivateState(checked: boolean) {
    this.isDetectorPrivate = checked;
  }
  //#endregion getPrivateCheckStatus Methods

  //#region getOnDemandRenderCheckStatus Methods
  public getOnDemandRenderCheckStatus(): boolean {
    return this.isOnDemandRenderEnabled;
  }

  public toggleOnDemandRenderState(checked: boolean) {
    this.isOnDemandRenderEnabled = checked;
  }
  //#endregion getPrivateCheckStatus Methods

  //#region Detector Analysis Picker Methods  

  public updateDetectorAnalysisSelectedItems(event:any):boolean {    
    //Add unique items to the selected items list, discard duplicates.
    let keys = new Set();
    this.detectorAnalysisPickerSelectedItems = event.items.filter(item => keys.has(item.key)? false: !!keys.add(item.key));
    return false;
  }
  
  public detectorAnalysisPickerInputChanged():any {
    const _this = this;
    return (data): ITagItemProps[] | Promise<ITagItemProps[]> => {
      return _this.detectorAnalysisPickerInputChangedClosureImpl(data, _this);
    }
  }

  public detectorAnalysisPickerInputChangedClosureImpl(data: any, thisPointer?:DetectorDesigner): ITagItemProps[] | Promise<ITagItemProps[]>{
    return DetectorDesigner.applensDiagnosticApiService.getDetectors().map<DetectorMetaData[], ITagItemProps[]>(response => {
    //return thisPointer.diagnosticApiService.getDetectors().map<DetectorMetaData[], ITagItemProps[]>(response => {      
      const analysisPickerOptions:AnalysisPickerModel[] = response.filter(detector=> detector.type === DetectorType.Analysis && (detector.id.toLowerCase().indexOf(data.toLowerCase()) > -1 || detector.name.toLowerCase().indexOf(data.toLowerCase()) > -1 )   )
      .map(analysisDetectors => <AnalysisPickerModel>{
        AnalysisId: analysisDetectors.id,
        AnalysisName: analysisDetectors.name
      } );
      
      analysisPickerOptions.sort((a:AnalysisPickerModel, b:AnalysisPickerModel):number =>{
        if(a.AnalysisName < b.AnalysisName) return -1;
        if(a.AnalysisName > b.AnalysisName) return 1;
        return 0;
      });

      let tagSuggestions:ITagItemProps[] = [];
      let tagIndex = 0;
      tagSuggestions = analysisPickerOptions.map<ITagItemProps>(option => <ITagItemProps>{
        index:tagIndex++,
        item:{
          key:option.AnalysisId,
          name:option.AnalysisName
        }
      });
      
      return tagSuggestions.slice(0, 5);
    }).toPromise();
  }
  
  //#endregion Detector Analysis Picker Methods

  //#region Support Topic Picker Methods
  public updateSupportTopicSelectedItems(event:any):boolean {
    //Add unique items to the selected items list, discard duplicates.
    let keys = new Set();
    this.supportTopicPickerSelectedItems = event.items.filter(item => keys.has(item.key)? false: !!keys.add(item.key));
    return false;    
  }

  public detectorSupportTopicPickerInputChanged():any {
    const _this = this;
    return (data): ITagItemProps[] | Promise<ITagItemProps[]> => {
      return _this.detectorSupportTopicPickerInputChangedClosureImpl(data, _this);
    }
  }

  public detectorSupportTopicPickerInputChangedClosureImpl(data: any, thisPointer?:DetectorDesigner): ITagItemProps[] | Promise<ITagItemProps[]> {
    return Promise.resolve(DetectorDesigner.applensResourceService.getPesId().map<string, Promise<ITagItemProps[]>>(pesId => {
      if(pesId) {
        return Promise.resolve(
          DetectorDesigner.applensDiagnosticApiService.getSupportTopics(pesId).map<supportTopicResponseModel[], ITagItemProps[]>(supportTopicList =>{
          const supportTopicPickerOptions:SupportTopicPickerModel[] = supportTopicList.filter(supportTopic=> supportTopic.supportTopicPath.toLowerCase().indexOf(data.toLowerCase()) > -1 || 
            supportTopic.supportTopicId.toString().startsWith(data) || supportTopic.sapSupportTopicId.toString().startsWith(data)
          )
          .map(supportTopic => <SupportTopicPickerModel>{
            PesId: pesId,
            SupportTopicId: supportTopic.supportTopicId,
            SapProductId: supportTopic.sapProductId,
            SapSupportTopicId: supportTopic.sapSupportTopicId,
            ProductName: supportTopic.productName,
            SupportTopicL2Name:supportTopic.supportTopicL2Name,
            SupportTopicL3Name:supportTopic.supportTopicL3Name,
            SupportTopicPath: supportTopic.supportTopicPath
          });

          supportTopicPickerOptions.sort((a:SupportTopicPickerModel, b:SupportTopicPickerModel):number =>{
            if(a.SupportTopicPath < b.SupportTopicPath) return -1;
              if(a.SupportTopicPath > b.SupportTopicPath) return 1;
              return 0;
          });

          let tagSuggestions:ITagItemProps[] = [];
          let tagIndex = 0;
          tagSuggestions = supportTopicPickerOptions.map<ITagItemProps>(option => <ITagItemProps>{
            index:tagIndex++,
            item:{
              key:option.SapSupportTopicId,
              name:option.SupportTopicPath
            }
          });

          return tagSuggestions.slice(0, 5);
        }).toPromise()
        ).then((tagSuggestions:ITagItemProps[]) => tagSuggestions);
      }
      else 
      {
        return Promise.resolve([]);
      }
    }).toPromise()).then((value:ITagItemProps[] | Promise<ITagItemProps[]>) => value);
  }

  //#endregion Support Topic Picker Methods
  
  //#endregion Detector Settings Panel Methods

  public detectorSettingsPanelOnOpened():void {
    console.log('Detector Settings Panel On Opened');    
    this.notifyPanelCloseSubject.take(1).subscribe((dismissAction) => {
      this.detectorSettingsPanelOnDismiss(dismissAction);
    });
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

export interface AnalysisPickerModel {
  AnalysisId: string;
  AnalysisName: string;
}

export interface supportTopicResponseModel {
  supportTopicId: string;
  sapSupportTopicId: string;
  sapProductId: string;
  supportTopicPath: string;
  productName: string;
  supportTopicL2Name: string;
  supportTopicL3Name:string
}

export interface SupportTopicPickerModel {
  SupportTopicId: string;
  PesId: string;
  SapSupportTopicId: string;
  SapProductId: string;
  SupportTopicPath: string;
  ProductName: string;
  SupportTopicL2Name: string;
  SupportTopicL3Name:string
}