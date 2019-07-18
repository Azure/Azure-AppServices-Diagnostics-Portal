import { DetectorControlService, FeatureNavigationService } from 'diagnostic-data';
import { HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import {ArmResourceConfig, HomePageText, ResourceDescriptor} from '../../../shared/models/arm/armResourceConfig';
import { ArmService } from '../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  resourceName: string;
  categories: Category[];
  searchValue = '';
  searchBoxFocus: boolean;
  searchLogTimout: any;
  event: any;
  subscriptionId: string;
  searchResultCount: number;
  homePageText: HomePageText;
  searchPlaceHolder: string = 'Search App Service Diagnostics';
  get inputAriaLabel(): string {
    return this.searchValue !== '' ?
        `${this.searchResultCount} Result` + (this.searchResultCount !== 1 ? 's' : '') :
        '';
  }

  constructor(private _resourceService: ResourceService, private _categoryService: CategoryService, private _notificationService: NotificationService, private _router: Router,
    private _detectorControlService: DetectorControlService, private _featureService: FeatureService, private _logger: LoggingV2Service, private _authService: AuthService,
    private _navigator: FeatureNavigationService, private _activatedRoute: ActivatedRoute, private armService: ArmService) {
      console.log(`Generic ARM Config Service ${_resourceService.armResourceConfig }`);
      console.log(_resourceService.armResourceConfig );
      console.log(`Resource :  ${_resourceService.resource.id}`);

    if(_resourceService.armResourceConfig !== null && _resourceService.armResourceConfig.homePageText 
      && _resourceService.armResourceConfig.homePageText.title && _resourceService.armResourceConfig.homePageText.title.length > 1
      && _resourceService.armResourceConfig.homePageText.description && _resourceService.armResourceConfig.homePageText.description.length > 1
      && _resourceService.armResourceConfig.homePageText.searchBarPlaceHolder && _resourceService.armResourceConfig.homePageText.searchBarPlaceHolder.length > 1) {
      this.homePageText = _resourceService.armResourceConfig.homePageText;
      this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
    }
    else {
      this.homePageText = null;      
    }


    if (_resourceService.armResourceConfig !== null) {
      this._categoryService.initCategoriesForArmResource(_resourceService.resource.id);
    }
    
    this._categoryService.categories.subscribe(categories => this.categories = categories);
        
    
    this._authService.getStartupInfo().subscribe(startupInfo => {
      if (startupInfo.additionalParameters && Object.keys(startupInfo.additionalParameters).length > 0) {
        let path = 'resource' + startupInfo.resourceId.toLowerCase();
        path = this._updateRouteBasedOnAdditionalParameters(path, startupInfo.additionalParameters);
        if (path) {
          this._router.navigateByUrl(path);
        }
      }
    });
    this.subscriptionId = this._activatedRoute.snapshot.params['subscriptionid'];
  }

  ngOnInit() {
    this.resourceName = this._resourceService.resource.name;

    if (!this._detectorControlService.startTime) {
      this._detectorControlService.setDefault();
    }
  }

  onSearchBoxFocus(event: any): void {
    this.searchBoxFocus = true;
  }

  clearSearch() {
    this.searchBoxFocus = false;
    this.searchValue = '';
    this.searchResultCount = 0;
  }

  updateSearchValue(searchValue) {
    this.searchValue = searchValue;

    if (this.searchLogTimout) {
      clearTimeout(this.searchLogTimout);
    }

    this.searchLogTimout = setTimeout(() => {
      this._logSearch();
    }, 5000);
  }

  onResultCount(count: number) {
    this.searchResultCount = count;
  }

  onSearchLostFocus() {
    if (this.searchValue === '') {
      this.searchResultCount = 0;
    }
  }

  onFocusClear() {
    if (this.searchValue === '') {
      this.clearSearch();
    }
  }

  private _updateRouteBasedOnAdditionalParameters(route: string, additionalParameters: any): string {
    if (additionalParameters.featurePath) {
      let featurePath: string = additionalParameters.featurePath;
      featurePath = featurePath.startsWith('/') ? featurePath.replace('/', '') : featurePath;

      return `${route}/${featurePath}`;
    }

    return null;
  }


  private _logSearch() {
    this._logger.LogSearch(this.searchValue);
  }
}
