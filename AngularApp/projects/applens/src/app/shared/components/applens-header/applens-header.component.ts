import { Component, Injector, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { IChoiceGroupOption, ISearchBoxProps } from 'office-ui-fabric-react';
import { SearchService } from '../../../modules/dashboard/services/search.service';
import { UserSettingService } from '../../../modules/dashboard/services/user-setting.service';
import { ResourceInfo } from '../../models/resources';
import { UserPanelSetting, UserSetting } from '../../models/user-setting';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { ApplensGlobal } from '../../../applens-global';
import { ApplensThemeService } from '../../services/applens-theme.service';
import { DetectorControlService } from 'diagnostic-data';


@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  userPhotoSource: string = "";
  userNameInitial: string = "";
  showCallout: boolean = false;
  applensLogo: string = "../../../../assets/img/Applens-Logo.svg";
  resourceInfo: ResourceInfo = new ResourceInfo();
  envTag: string = "";
  searchValue: string = "";
  searchStyles: ISearchBoxProps['styles'] = {
    root: {
      minWidth: "300px"
    },
    clearButton: {
      display: "none"
    }
  };
  expandCheckCard: boolean = false;
  darkThemeChecked: boolean = false;
  codeCompletionChecked: boolean = false;
  smartViewChecked: boolean = false;
  //Only If user changed setting, then send request to backend
  userSettingChanged: boolean = false;
  expandAnalysisChanged: boolean = false;
  themeChanged: boolean = false;
  viewModeChanged: boolean = false;
  selectedKey: string = "smarter";
  showGPTComponent: boolean = false;
  choiceGroupOptions: IChoiceGroupOption[] = [
    { key: 'smarter', text: 'Smart Grouping', onClick: () => { this.smartViewChecked = true; this.selectedKey = "smarter"; } },
    { key: 'waterfall', text: 'Waterfall', onClick: () => { this.smartViewChecked = false; this.selectedKey = "waterfall"; } }
  ];

  constructor(private _adalService: AdalService, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute, private _userSettingService: UserSettingService, private _router: Router, private _themeService: ApplensThemeService, private _detectorControlService: DetectorControlService, @Optional() public _searchService?: SearchService, @Optional() private _applensGlobal?: ApplensGlobal) {
    this._router.events.subscribe((val) => {
      // see also
      this.checkGPTRoute();
    });
  }

  ngOnInit() {
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');

    this.checkGPTRoute();

    if (this._adalService.userInfo.profile) {
      const familyName: string = this._adalService.userInfo.profile.family_name;
      const givenName: string = this._adalService.userInfo.profile.given_name;
      this.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
    }

    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this.userPhotoSource = image;
    });

    if (this._activatedRoute.snapshot.queryParams["searchTerm"]) {
      const searchValue: string = this._activatedRoute.snapshot.queryParams["searchTerm"];
      this.searchValue = searchValue.trim();
    }

    if (this._activatedRoute.snapshot.data["info"]) {
      this.resourceInfo = this._activatedRoute.snapshot.data["info"];
    }

    this._userSettingService.getUserSetting().subscribe(userSettings => {
      this.expandCheckCard = userSettings ? userSettings.expandAnalysisCheckCard : false;
      this.darkThemeChecked = userSettings && userSettings.theme.toLowerCase() == "dark" ? true : false;
      this.codeCompletionChecked = userSettings && userSettings.codeCompletion && userSettings.codeCompletion.toLowerCase() == "off" ? false : true;
      this.smartViewChecked = userSettings && userSettings.viewMode.toLowerCase() == "smarter" ? true : false;
      this.selectedKey = userSettings && userSettings.viewMode.toLowerCase() == "smarter" ? "smarter" : "waterfall";
    });

    this._diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
      this.envTag = `(${env})`;
    });
  }

  checkGPTRoute(){
    if (this._router.url.includes("chatgpt")) {
      this.showGPTComponent = true;
    }
    else {
      this.showGPTComponent = false;
    }
  }

  navigateToLandingPage() {
    window.location.href = "/";
  }

  toggleExpandCheckCard(event: { checked: boolean }) {
    this.expandAnalysisChanged = !this.expandAnalysisChanged;
    this.userSettingChanged = this.expandAnalysisChanged || this.themeChanged || this.viewModeChanged;
    this.expandCheckCard = event.checked;
  }

  toggleTheme(event: { checked: boolean }) {
    this.themeChanged = !this.themeChanged;
    this.userSettingChanged = this.expandAnalysisChanged || this.themeChanged || this.viewModeChanged;
    this.darkThemeChecked = event.checked;
  }

  toggleCodeCompletion(event: { checked: boolean }) {
    this.codeCompletionChecked = event.checked;
  }

  toggleViewMode(event: { checked: boolean }) {
    this.viewModeChanged = !this.viewModeChanged;
    this.userSettingChanged = this.expandAnalysisChanged || this.themeChanged || this.viewModeChanged;
    this.smartViewChecked = !event.checked;
  }

  //Can add more updated userSetting into it
  private updateUserSettingsFromPanel() {
    const themeStr = this.darkThemeChecked ? "dark" : "light";
    const updatedSettings: UserPanelSetting = {
      codeCompletion: this.codeCompletionChecked ? "on": "off",
      expandAnalysisCheckCard: this.expandCheckCard,
      theme: themeStr,
      viewMode: this.smartViewChecked ? "smarter" : "waterfall"
    };
    this._themeService.setActiveTheme(themeStr);
    this._userSettingService.isWaterfallViewSub.next(!this.smartViewChecked);
    this._userSettingService.updateUserPanelSetting(updatedSettings).subscribe(res => {}, err => {});
    setTimeout(() => {window.location.reload();}, 1000);
  }

  openCallout() {
    this.showCallout = true;
  }

  applyUserSettingChange() {
    this.updateUserSettingsFromPanel();
    this._detectorControlService.refresh("V3ControlRefresh");
    this.showCallout = false;
  }

  cancelUserSettingChange() {
    this.showCallout = false;
  }

  triggerSearch() {
    this._searchService.searchTerm = this.searchValue;

    this._searchService.searchTerm = this._searchService.searchTerm.trim();

    const navigationExtras: NavigationExtras = {
      queryParamsHandling: "merge",
      preserveFragment: true,
      relativeTo: this._activatedRoute,
      queryParams: { searchTerm: this._searchService.searchTerm }
    };

    if (this._searchService.searchIsEnabled && this._searchService.searchTerm && this._searchService.searchTerm.length > 3) {
      this._router.navigate([`search`], navigationExtras);
    }
  }

  updateSearchValue(searchValue: { newValue: any }) {
    if (!!searchValue && !!searchValue.newValue && !!searchValue.newValue.currentTarget && !!searchValue.newValue.currentTarget.value) {
      this.searchValue = searchValue.newValue.currentTarget.value;
    }
  }

  openResourceInfoModal() {
    this._applensGlobal.openResourceInfoPanel = true;
  }

}
