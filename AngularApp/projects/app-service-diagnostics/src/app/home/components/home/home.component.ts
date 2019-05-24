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
  get inputAriaLabel(): string {
    return this.searchValue !== '' ?
        `${this.searchResultCount} Result` + (this.searchResultCount !== 1 ? 's' : '') :
        '';
  }

  constructor(private _resourceService: ResourceService, private _categoryService: CategoryService, private _notificationService: NotificationService, private _router: Router,
    private _detectorControlService: DetectorControlService, private _featureService: FeatureService, private _logger: LoggingV2Service, private _authService: AuthService,
    private _navigator: FeatureNavigationService, private _activatedRoute: ActivatedRoute, private armService: ArmService) {
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
    this.registerChangeAnalysisFeature();
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
    if (this.searchValue == '') {
      this.searchResultCount = 0;
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

  registerChangeAnalysisFeature(): void {
    let url = `/subscriptions/${this.subscriptionId}/providers/Microsoft.Features/providers/Microsoft.ChangeAnalysis/features/PreviewAccess/register`;
    this.armService.postResourceFullResponse(url, {}, true, '2015-12-01').subscribe((data: HttpResponse<{}>) => {
        let logData = {
            'subscriptionId' : this.subscriptionId,
            'responseStatus': data.status
        };
        this._logger.LogAction('Home', 'Registered Change Analysis feature', logData)
    }, (error: any) => {
        this._logger.LogError('HTTP Error while registering change analysis feature: '+error.message, + 'Status Code : '+error.status);
    });
  }
}
