import { Component, Injector, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ISearchBoxProps } from 'office-ui-fabric-react';
import { SearchService } from '../../../modules/dashboard/services/search.service';
import { UserSettingService } from '../../../modules/dashboard/services/user-setting.service';
import { ResourceInfo } from '../../models/resources';
import { UserSetting } from '../../models/user-setting';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { ApplensGlobal } from '../../../applens-global';


@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  userPhotoSource: string = "";
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
  //Only If user changed setting, then send request to backend
  userSettingChanged: boolean = false;

  constructor(private _adalService: AdalService,  private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute, private _userSettingService: UserSettingService, private _router: Router, @Optional() public _searchService?: SearchService, @Optional() private _applensGlobal?: ApplensGlobal) { }


  ngOnInit() {
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
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
        this.expandCheckCard = userSettings ? userSettings.expandAnalysisCheckCard : false;});

    this._diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
      this.envTag = `(${env})`;
    });
  }

  navigateToLandingPage() {
    window.location.href = "/";
  }

  toggleExpandCheckCard(event: { checked: boolean }) {
    this.userSettingChanged = true;
    this.expandCheckCard = event.checked;
  }

  //Can add more updated userSetting into it
  private updateUserSetting() {
    this._userSettingService.updateUserSetting(this.expandCheckCard, this.updateUserSettingCallBack);
  }

  private updateUserSettingCallBack(expandAnalysisCard: boolean, userSettings: UserSetting): UserSetting {
    const newUserSetting = { ...userSettings };
    newUserSetting.expandAnalysisCheckCard = expandAnalysisCard;
    return newUserSetting;
  }

  openCallout() {
    this.showCallout = true;
  }

  applyUserSettingChange() {
    if(this.userSettingChanged) {
      this.updateUserSetting();
    }
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
