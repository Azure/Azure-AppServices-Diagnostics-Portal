import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../applens-global';
import { IBasePickerProps, ITagPickerProps, ITagItemProps, ISuggestionModel, ITag, TagItem, IButtonStyles, IChoiceGroupOption, IDialogContentProps, IDialogProps, IDropdownOption, IDropdownProps, IIconProps, IPanelProps, IPersona, IPersonaProps, IPickerItemProps, IPivotProps, ITextFieldProps, MessageBarType, PanelType, SelectableOptionMenuItemType, TagItemSuggestion, IDropdown, ICalloutProps, ICheckboxStyleProps, ICheckboxProps } from 'office-ui-fabric-react';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { AdalService } from 'adal-angular4';
import { DetectorMetaData, DetectorType, GenericThemeService, TelemetryService } from 'diagnostic-data';
import { InputRendererOptions } from '@angular-react/core';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { AppType, PlatformType, SitePropertiesParser, StackType } from '../../../shared/utilities/applens-site-properties-parsing-utilities';

@Component({
  selector: 'detector-settings-panel',
  templateUrl: './detector-settings-panel.component.html',
  styleUrls: ['./detector-settings-panel.component.scss']
})

export class DetectorSettingsPanel {
  @Input('id') rootId?: string = 'detectorSettingsPanel';
  @Input() headerText?: string = 'Configure';

  @Input() isOpen: boolean = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  @Output() onOpened = new EventEmitter<void>();
  @Output() onDismiss = new EventEmitter<string>();


  PanelType = PanelType;

  //#region Fab element styles
  fabTextFieldStyleNoStretch: ITextFieldProps["styles"] = {
    field: {
      width: '300px'
    }
  };

  fabTextFieldStyleNoStretchWide: ITextFieldProps["styles"] = {
    field: {
      width: '400px'
    }
  };

  fabDropdownStyle: IDropdownProps["styles"] = {
    root: {
      minWidth: '100px'
    },
    dropdownItem: {
      width: '200px'
    },
    errorMessage: {
      paddingLeft: '0em'
    },
    dropdown: {
      minWidth: '100px'
    }
  };

  fabDropdownMultiselectCalloutProps: IDropdownProps['calloutProps'] = {
    styles: {
      root: {
        width: '200px'
      }
    }
  };

  fabCheckboxStyle: ICheckboxProps['styles'] = {
    text: {
      fontWeight: 600
    }
  };

  //#endregion

  public detectorName: string = '';
  public detectorId: string = '';

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
  effectiveResourceAppType: AppType[] = [];
  resourceAppTypeRequiredErrorMessage: string = '';
  resourceAppTypeOptions: IDropdownOption[] = [];
  resourceAppTypeOptionsDefaultSelectedKeys: string[] = [];
  //#endregion AppType dropdown settings

  //#region PlatformType dropdown settings
  effectiveResourcePlatformType: PlatformType[] = [];
  resourcePlatformTypeRequiredErrorMessage: string = '';
  resourcePlatformTypeOptions: IDropdownOption[] = [];
  resourcePlatformTypeOptionsDefaultSelectedKeys: string[] = [];
  //#endregion PlatformType dropdown settings

  //#region StackType dropdown settings
  effectiveResourceStackType: StackType[] = [];
  resourceStackTypeRequiredErrorMessage: string = '';
  resourceStackTypeOptions: IDropdownOption[] = [];
  resourceStackTypeOptionsDefaultSelectedKeys: string[] = [];
  //#endregion StackType dropdown settings

  isInternalOnly: boolean = true;
  isDetectorPrivate: boolean = false;
  isOnDemandRenderEnabled: boolean = false;

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


  // Had to add this to make the people picker work.
  // People picker component has a bug. https://github.com/microsoft/angular-react/issues/213
  public static applensDiagnosticApiService: ApplensDiagnosticService;
  public static applensResourceService: ResourceService;

  constructor(private _applensGlobal: ApplensGlobal, private _activatedRoute: ActivatedRoute, private _router: Router, public diagnosticApiService: ApplensDiagnosticService,
    private _diagnosticApi: DiagnosticApiService, private resourceService: ResourceService, private _adalService: AdalService, private _telemetryService: TelemetryService,
    private _themeService: GenericThemeService) {

    this._applensGlobal.updateHeader('');
    DetectorSettingsPanel.applensDiagnosticApiService = this.diagnosticApiService;
    DetectorSettingsPanel.applensResourceService = this.resourceService;

    this.resetGlobals();
  }

  public get isAppService(): boolean {
    return this.resourceService.ArmResource.provider.toLowerCase() === 'microsoft.web' && this.resourceService.ArmResource.resourceTypeName.toLowerCase() === 'sites';
  }

  resetGlobals(): void {
    this.detectorName = 'Auto Generated Detector Name';
    this.resetSettingsPanel();
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
        itemType: SelectableOptionMenuItemType.Normal
      },
      {
        key: 'Detector',
        text: 'Detector',
        selected: true,
        index: 1,
        itemType: SelectableOptionMenuItemType.Normal
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
    let authorIds: IPersonaProps[] = [];


    //Push logged-in user's detail
    this.detectorAuthorIds.push({
      text: `${this.loggedInUserId}`,
      secondaryText: `${(this._adalService.userInfo.profile ? this._adalService.userInfo.profile.name : this._adalService.userInfo.userName)}`,
      showSecondaryText: false,
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

    if (this.isAppService) {
      //TODO: Initialize this with whatever the detector is currently set to.
      //#region resourceAppTypeOptions, resourcePlatformTypeOptions and resourceStackTypeOptions dropdown options
      this.resourceAppTypeOptionsDefaultSelectedKeys = [SitePropertiesParser.getDisplayForAppType(AppType.All)];

      let optionIndex = 0;

      this.resourceAppTypeOptions = [<IDropdownOption>{
        key: SitePropertiesParser.getDisplayForAppType(AppType.All),
        text: SitePropertiesParser.getDisplayForAppType(AppType.All),
        selected: this.resourceAppTypeOptionsDefaultSelectedKeys.some(key => key === SitePropertiesParser.getDisplayForAppType(AppType.All)),
        index: optionIndex++
      }];

      // Iterate through the enum and add the options
      for (let appType in AppType) {
        if (isNaN(Number(appType)) && !this.resourceAppTypeOptions.some(option => option.key === appType)) {
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
      this.resourcePlatformTypeOptionsDefaultSelectedKeys = [SitePropertiesParser.getDisplayForPlatformType(PlatformType.All)];
      optionIndex = 0;
      this.resourcePlatformTypeOptions = [<IDropdownOption>{
        key: SitePropertiesParser.getDisplayForPlatformType(PlatformType.All),
        text: SitePropertiesParser.getDisplayForPlatformType(PlatformType.All),
        selected: this.resourcePlatformTypeOptionsDefaultSelectedKeys.some(key => key === SitePropertiesParser.getDisplayForPlatformType(PlatformType.All)),
        index: optionIndex++
      }];

      // Iterate through the enum and add the options
      for (let platformType in PlatformType) {
        if (isNaN(Number(platformType)) && !this.resourcePlatformTypeOptions.some(option => option.key === platformType)) {
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
      this.resourceStackTypeOptionsDefaultSelectedKeys = [SitePropertiesParser.getDisplayForStackType(StackType.All)];
      optionIndex = 0;
      this.resourceStackTypeOptions = [<IDropdownOption>{
        key: SitePropertiesParser.getDisplayForStackType(StackType.All),
        text: SitePropertiesParser.getDisplayForStackType(StackType.All),
        selected: this.resourceStackTypeOptionsDefaultSelectedKeys.some(key => key === SitePropertiesParser.getDisplayForStackType(StackType.All)),
        index: optionIndex++
      }];

      // Iterate through the enum and add the options
      for (let stackType in StackType) {
        if (isNaN(Number(stackType)) && !this.resourceStackTypeOptions.some(option => option.key === stackType)) {
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

  public getDetectorId(): string {
    return this.resourceService.ArmResource.provider + '_' + this.resourceService.ArmResource.resourceTypeName + '_' + this.detectorName.replace(/\s/g, '_',).replace(/\./g, '_');
  }



  public detectorSettingsPanelOnOpened(): void {
    //console.log('Component : Detector Settings Panel component OnOpened: ' + window.performance.now().toString());
    this.onOpened.emit();
  }

  public detectorSettingsPanelOnDismiss(dismissAction: string): void {
    //console.log('Component : Detector Settings Panel component OnDismiss fired : ' + dismissAction  + ' ' + window.performance.now().toString());
    if (dismissAction === 'Save') {
      // Save the state here.      
    }
    else {
      //Ensure that the state is reset.
      this.resetSettingsPanel();
    }
    this.isOpen = false;
    this.isOpenChange.emit(this.isOpen);
    this.onDismiss.emit(dismissAction);
  }


  public getRequiredErrorMessageOnTextField(value: string): string {
    if (!value) {
      return 'Value cannot be empty';
    };
  }

  public onChangeDetectorType(event: any): void {
    this.detectorType = event.option.key.toString();
  }

  //#region Detector Author Picker Methods
  public getUserPersonaInfoFromAlias(alias: string): Observable<IPersonaProps> {
    let userInfo = this.diagnosticApiService.getUserInfo(alias).map(userInfo => { return (userInfo && userInfo.displayName) ? userInfo.displayName : '' });
    let userImage = this.diagnosticApiService.getUserPhoto(alias).map(image => { return image });

    return forkJoin([userInfo, userImage]).pipe(mergeMap(results => {
      return of(<IPersonaProps>{
        text: alias,
        secondaryText: results[0] ? results[0] : alias,
        imageUrl: results[1],
        showSecondaryText: false,
        showInitialsUntilImageLoads: true
      });
    }));
  }

  public updateDetectorAuthorIdsWithNewState(newItemsState: IPersonaProps[]): void {
    if (newItemsState.length > 0) {
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
      let userPersonaTasks: Observable<IPersonaProps>[] = [];
      this.detectorAuthorIds.forEach(detectorAuthor => {
        if (!detectorAuthor.imageUrl || detectorAuthor.text == detectorAuthor.secondaryText) {
          userPersonaTasks.push(this.getUserPersonaInfoFromAlias(detectorAuthor.text));
        }
      });

      //Wait for all the user persona info to be fetched and update the detectorAuthorIds
      forkJoin(userPersonaTasks).subscribe(userPersonaInfos => {
        userPersonaInfos.forEach(userPersonaInfo => {
          let itemToUpdate = this.detectorAuthorIds.findIndex(detectorAuthor => detectorAuthor.text === userPersonaInfo.text);
          if (itemToUpdate > -1) {
            this.detectorAuthorIds[itemToUpdate] = userPersonaInfo;
          }
        });
      },
        () => {/* Ignore errors*/ },
        () => {
          //ForkJoin complete. Update the detectorAuthorPickerSelectedItems now that we have the user persona info in detectorAuthorIds
          this.detectorAuthorPickerSelectedItems = this.detectorAuthorIds;
        });
    }
  }

  public updateDetectorAuthorSelectedItems(event: any): boolean {
    this.updateDetectorAuthorIdsWithNewState(event.items);
    return false;
  }

  public detectorAuthorPickerSuggestionsResolver(data: any): IPersonaProps[] | Promise<IPersonaProps[]> {
    //Issue: https://github.com/microsoft/angular-react/issues/213
    if (data) {
      return DetectorSettingsPanel.applensDiagnosticApiService.getSuggestionForAlias(data).map(response => {
        let suggestions: IPersonaProps[] = [];
        response.forEach(suggestion => {
          if (suggestion && suggestion.userPrincipalName)
            suggestions.push({
              text: `${suggestion.userPrincipalName.toLowerCase().replace('@microsoft.com', '')}`,
              secondaryText: `${suggestion.userPrincipalName.toLowerCase().replace('@microsoft.com', '')}`,
              showSecondaryText: false,
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
  }
  //#endregion Detector Author Picker Methods

  //#region Detector Category Picker Methods
  public updateDetectorCategorySelectedItems(event: any): boolean {
    console.log('updateDetectorCategorySelectedItems');
    console.log(event);
    this.detectorCategoryPickerSelectedItems = event.items;
    return false;
  }

  public detectorCategoryPickerSuggestionsResolver(data: any): ITagItemProps[] | Promise<ITagItemProps[]> {
    return DetectorSettingsPanel.applensDiagnosticApiService.getDetectors().map<DetectorMetaData[], ITagItemProps[]>(response => {
      const categories: string[] = Array.from(new Set(response.filter(detector => detector.category && detector.category.toLowerCase().indexOf(data.toLowerCase()) > -1)
        .map(detectorsWithCategory => detectorsWithCategory.category)));

      categories.sort();

      let tagSuggestions: ITagItemProps[] = [];
      let tagIndex = 0;
      tagSuggestions = categories.map<ITagItemProps>(category => <ITagItemProps>{
        index: tagIndex++,
        item: {
          key: category,
          name: category
        }
      });

      //Adds the current input string as a suggestion if it is not already present in the list
      if (data && !tagSuggestions.some(item => item.item.key.toString().toLowerCase() == data.toString().toLowerCase())) {
        tagSuggestions.push(<ITagItemProps>{
          index: tagIndex++,
          item: {
            key: data,
            name: data
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
  public handleResourceAppTypeOptions(selectedOption?: any): void {
    //Due to a bug in multiselect mode for dropdowns where the changes in model is not passed on to the callout that displays the optionson UI, we cannot have the UI reflect the same state as the model.
    //Do not try to uncheck/check stuff based on AppType.All, merely maintain the state of the model as reflected in the UI.

    this.resourceAppTypeRequiredErrorMessage = '';

    if (this.resourceAppTypeOptions.length > 0) {
      if (selectedOption) {
        // This ensures that the model is updated with the latest state of the UI
        this.resourceAppTypeOptions[this.resourceAppTypeOptions.findIndex(option => option.key === selectedOption.key)].selected = selectedOption.selected;
      }

      //Determine the effective resource app type
      if (this.resourceAppTypeOptions.find(option => option.key === SitePropertiesParser.getDisplayForAppType(AppType.All)).selected === true) {
        this.effectiveResourceAppType = [AppType.All];
      }
      else {
        this.effectiveResourceAppType = this.resourceAppTypeOptions.filter(option => option.selected).map(option => AppType[option.key] as AppType);
      }

      this.resourceAppTypeRequiredErrorMessage = this.effectiveResourceAppType.length === 0 && this.resourceAppTypeOptions.length > 0 ? 'At least one App type is required' : '';
    }
    else {
      this.effectiveResourceAppType = [];
    }

  }

  public onChangeResourceAppType(event: any): void {
    this.handleResourceAppTypeOptions(event.option);
  }
  //#endregion Detector App Type dropdown Methods

  //#region Detector Platform Type dropdown Methods
  public handleResourcePlatformTypeOptions(selectedOption?: any): void {
    //Due to a bug in multiselect mode for dropdowns where the changes in model is not passed on to the callout that displays the optionson UI, we cannot have the UI reflect the same state as the model.
    //Do not try to uncheck/check stuff based on AppType.All, merely maintain the state of the model as reflected in the UI.

    this.resourcePlatformTypeRequiredErrorMessage = '';

    if (this.resourcePlatformTypeOptions.length > 0) {
      if (selectedOption) {
        // This ensures that the model is updated with the latest state of the UI
        this.resourcePlatformTypeOptions[this.resourcePlatformTypeOptions.findIndex(option => option.key === selectedOption.key)].selected = selectedOption.selected;
      }

      //Determine the effective resource app type
      if (this.resourcePlatformTypeOptions.find(option => option.key === SitePropertiesParser.getDisplayForPlatformType(PlatformType.All)).selected === true) {
        this.effectiveResourcePlatformType = [PlatformType.All];
      }
      else {
        this.effectiveResourcePlatformType = this.resourcePlatformTypeOptions.filter(option => option.selected).map(option => PlatformType[option.key] as PlatformType);
      }

      this.resourcePlatformTypeRequiredErrorMessage = this.effectiveResourcePlatformType.length === 0 && this.resourcePlatformTypeOptions.length > 0 ? 'At least one Platform type is required' : '';
    }
    else {
      this.effectiveResourcePlatformType = [];
    }
  }

  public onChangeResourcePlatformType(event: any): void {
    this.handleResourcePlatformTypeOptions(event.option);
  }
  //#endregion Detector Platform Type dropdown Methods

  //#region Detector Stack Type dropdown Methods
  public handleResourceStackTypeOptions(selectedOption?: any): void {
    //Due to a bug in multiselect mode for dropdowns where the changes in model is not passed on to the callout that displays the optionson UI, we cannot have the UI reflect the same state as the model.
    //Do not try to uncheck/check stuff based on AppType.All, merely maintain the state of the model as reflected in the UI.

    this.resourceStackTypeRequiredErrorMessage = '';

    if (this.resourceStackTypeOptions.length > 0) {
      if (selectedOption) {
        // This ensures that the model is updated with the latest state of the UI
        this.resourceStackTypeOptions[this.resourceStackTypeOptions.findIndex(option => option.key === selectedOption.key)].selected = selectedOption.selected;
      }

      //Determine the effective resource app type
      if (this.resourceStackTypeOptions.find(option => option.key === SitePropertiesParser.getDisplayForStackType(StackType.All)).selected === true) {
        this.effectiveResourceStackType = [StackType.All];
      }
      else {
        this.effectiveResourceStackType = this.resourceStackTypeOptions.filter(option => option.selected).map(option => StackType[option.key] as StackType);
      }

      this.resourceStackTypeRequiredErrorMessage = this.effectiveResourceStackType.length === 0 && this.resourceStackTypeOptions.length > 0 ? 'At least one Stack type is required' : '';
    }
    else {
      this.effectiveResourceStackType = [];
    }
  }

  public onChangeResourceStackType(event: any): void {
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

  //#region isDetectorPrivate Methods
  public getDetectorPrivateCheckStatus(): boolean {
    return this.isDetectorPrivate;
  }

  public toggleDetectorPrivateState(checked: boolean) {
    this.isDetectorPrivate = checked;
  }
  //#endregion isDetectorPrivate Methods

  //#region isOnDemandRenderEnabled Methods
  public getOnDemandRenderCheckStatus(): boolean {
    return this.isOnDemandRenderEnabled;
  }

  public toggleOnDemandRenderState(checked: boolean) {
    this.isOnDemandRenderEnabled = checked;
  }
  //#endregion isOnDemandRenderEnabled Methods

  //#region Detector Analysis Picker Methods  
  public updateDetectorAnalysisSelectedItems(event: any): boolean {
    //Add unique items to the selected items list, discard duplicates.
    let keys = new Set();
    this.detectorAnalysisPickerSelectedItems = event.items.filter(item => keys.has(item.key) ? false : !!keys.add(item.key));
    return false;
  }

  public detectorAnalysisPickerSuggestionsResolver(data: any): ITagItemProps[] | Promise<ITagItemProps[]> {
    return DetectorSettingsPanel.applensDiagnosticApiService.getDetectors().map<DetectorMetaData[], ITagItemProps[]>(response => {
      const analysisPickerOptions: AnalysisPickerModel[] = response.filter(detector => detector.type === DetectorType.Analysis && (detector.id.toLowerCase().indexOf(data.toLowerCase()) > -1 || detector.name.toLowerCase().indexOf(data.toLowerCase()) > -1))
        .map(analysisDetectors => <AnalysisPickerModel>{
          AnalysisId: analysisDetectors.id,
          AnalysisName: analysisDetectors.name
        });

      analysisPickerOptions.sort((a: AnalysisPickerModel, b: AnalysisPickerModel): number => {
        if (a.AnalysisName < b.AnalysisName) return -1;
        if (a.AnalysisName > b.AnalysisName) return 1;
        return 0;
      });

      let tagSuggestions: ITagItemProps[] = [];
      let tagIndex = 0;
      tagSuggestions = analysisPickerOptions.map<ITagItemProps>(option => <ITagItemProps>{
        index: tagIndex++,
        item: {
          key: option.AnalysisId,
          name: option.AnalysisName
        }
      });

      return tagSuggestions.slice(0, 5);
    }).toPromise();
  }
  //#endregion Detector Analysis Picker Methods

  //#region Support Topic Picker Methods
  public updateSupportTopicSelectedItems(event: any): boolean {
    //Add unique items to the selected items list, discard duplicates.
    let keys = new Set();
    this.supportTopicPickerSelectedItems = event.items.filter(item => keys.has(item.key) ? false : !!keys.add(item.key));
    return false;
  }

  public detectorSupportTopicPickerSuggestionsResolver(data: any): ITagItemProps[] | Promise<ITagItemProps[]> {
    return Promise.resolve(DetectorSettingsPanel.applensResourceService.getPesId().map<string, Promise<ITagItemProps[]>>(pesId => {
      if (pesId) {
        return Promise.resolve(
          DetectorSettingsPanel.applensDiagnosticApiService.getSupportTopics(pesId).map<supportTopicResponseModel[], ITagItemProps[]>(supportTopicList => {
            const supportTopicPickerOptions: SupportTopicPickerModel[] = supportTopicList.filter(supportTopic => supportTopic.supportTopicPath.toLowerCase().indexOf(data.toLowerCase()) > -1 ||
              supportTopic.supportTopicId.toString().startsWith(data) || supportTopic.sapSupportTopicId.toString().startsWith(data)
            )
              .map(supportTopic => <SupportTopicPickerModel>{
                PesId: pesId,
                SupportTopicId: supportTopic.supportTopicId,
                SapProductId: supportTopic.sapProductId,
                SapSupportTopicId: supportTopic.sapSupportTopicId,
                ProductName: supportTopic.productName,
                SupportTopicL2Name: supportTopic.supportTopicL2Name,
                SupportTopicL3Name: supportTopic.supportTopicL3Name,
                SupportTopicPath: supportTopic.supportTopicPath
              });

            supportTopicPickerOptions.sort((a: SupportTopicPickerModel, b: SupportTopicPickerModel): number => {
              if (a.SupportTopicPath < b.SupportTopicPath) return -1;
              if (a.SupportTopicPath > b.SupportTopicPath) return 1;
              return 0;
            });

            let tagSuggestions: ITagItemProps[] = [];
            let tagIndex = 0;
            tagSuggestions = supportTopicPickerOptions.map<ITagItemProps>(option => <ITagItemProps>{
              index: tagIndex++,
              item: {
                key: option.SapSupportTopicId,
                name: option.SupportTopicPath
              }
            });

            return tagSuggestions.slice(0, 5);
          }).toPromise()
        ).then((tagSuggestions: ITagItemProps[]) => tagSuggestions);
      }
      else {
        return Promise.resolve([]);
      }
    }).toPromise()).then((value: ITagItemProps[] | Promise<ITagItemProps[]>) => value);
  }
  //#endregion Support Topic Picker Methods

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
  supportTopicL3Name: string
}

export interface SupportTopicPickerModel {
  SupportTopicId: string;
  PesId: string;
  SapSupportTopicId: string;
  SapProductId: string;
  SupportTopicPath: string;
  ProductName: string;
  SupportTopicL2Name: string;
  SupportTopicL3Name: string
}

export class DetectorSettingsModel {
  public detectorId: string;
  public detectorName: string;
  public isDetectorPrivate: boolean;
  public isOnDemandRenderEnabled: boolean;
  public detectorAnalysisList: string[];
  public supportTopicList: string[];
  public GetJson(): string {
    return "";
  }
}