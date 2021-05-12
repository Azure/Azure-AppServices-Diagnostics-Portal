import { AdalService } from 'adal-angular4';
import { filter } from 'rxjs/operators';
import { Component, OnInit, PipeTransform, Pipe } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { ResourceService } from '../../../shared/services/resource.service';
import { CollapsibleMenuItem } from '../../../collapsible-menu/components/collapsible-menu-item/collapsible-menu-item.component';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DetectorType } from 'diagnostic-data';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {

  userId: string = "";

  detectorsLoading: boolean = true;

  currentRoutePath: string[];

  categories: CollapsibleMenuItem[] = [];
  analysisTypes: CollapsibleMenuItem[] = [];

  gists: CollapsibleMenuItem[] = [];

  searchValue: string;

  contentHeight: string;

  getDetectorsRouteNotFound: boolean = false;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _adalService: AdalService, private _diagnosticApiService: ApplensDiagnosticService, public resourceService: ResourceService, private _telemetryService: TelemetryService) {
    this.contentHeight = (window.innerHeight - 139) + 'px';
    if (environment.adal.enabled) {
      let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
      this.userId = alias.replace('@microsoft.com', '');
    }
  }

  documentation: CollapsibleMenuItem[] = [
    {
      label: 'Online Documentation',
      id: "",
      onClick: () => { window.open('https://app-service-diagnostics-docs.azurewebsites.net/api/Diagnostics.ModelsAndUtils.Models.Response.html#extensionmethods', '_blank') },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    }
  ];

  createNew: CollapsibleMenuItem[] = [
    {
      label: 'Your Detectors',
      id: "",
      onClick: () => {
        this.navigateToUserPage();
      },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    },
    {
      label: 'New Detector',
      id: "",
      onClick: () => {
        this.navigateTo('create');
      },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    },
    {
      label: 'New Gist',
      id: "",
      onClick: () => {
        this.navigateTo('createGist');
      },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    }
  ];

  configuration: CollapsibleMenuItem[] = [
    {
      label: 'Kusto Mapping',
      onClick: () => {
        this.navigateTo('kustoConfig');
      },
      id: "",
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    }
  ];

  ngOnInit() {
    this.initializeDetectors();

    this.getCurrentRoutePath();

    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.getCurrentRoutePath();
    });
  }

  private getCurrentRoutePath() {
    this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };

    this._router.navigate(path.split('/'), navigationExtras);
  }

  navigateToUserPage() {
    this.navigateTo(`users/${this.userId}`);
  }

  initializeDetectors() {
    this._diagnosticApiService.getDetectors().subscribe(detectorList => {
      if (detectorList) {
        detectorList.forEach(element => {
          let onClick = () => {
            this._telemetryService.logEvent(TelemetryEventNames.SideNavigationItemClicked, { "elementId": element.id });
            this.navigateTo(`detectors/${element.id}`);
          };

          let isSelected = () => {
            return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
          };

          let category = element.category ? element.category : "Uncategorized";
          let menuItem = new CollapsibleMenuItem(element.name, element.id, onClick, isSelected, null, false, [], element.supportTopicList && element.supportTopicList.length > 0 ? element.supportTopicList.map(x => x.id).join(",") : null);

          let categoryMenuItem = this.categories.find((cat: CollapsibleMenuItem) => cat.label === category);
          if (!categoryMenuItem) {
            categoryMenuItem = new CollapsibleMenuItem(category, "", null, null, null, false);
            this.categories.push(categoryMenuItem);
          }

          categoryMenuItem.subItems.push(menuItem);
          if (element.type === DetectorType.Analysis) {
            let onClickAnalysisParent = () => {
              this.navigateTo(`analysis/${element.id}`);
            };

            let isSelectedAnalysis = () => {
              this.getCurrentRoutePath();
              return this.currentRoutePath && this.currentRoutePath.join('/') === `analysis/${element.id}`;
            }

            let analysisMenuItem = new CollapsibleMenuItem(element.name, element.id, onClickAnalysisParent, isSelectedAnalysis, null, true, [], element.supportTopicList && element.supportTopicList.length > 0 ? element.supportTopicList.map(x => x.id).join(",") : null);
            this.analysisTypes.push(analysisMenuItem);

          }
        });

        this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));

        this.detectorsLoading = false;
        this._telemetryService.logPageView(TelemetryEventNames.SideNavigationLoaded, {});
      }
    },
      error => {
        // TODO: handle detector route not found
        if (error && error.status === 404) {
          this.getDetectorsRouteNotFound = true;
        }
      });

    this._diagnosticApiService.getGists().subscribe(gistList => {
      if (gistList) {
        gistList.forEach(element => {
          let onClick = () => {
            this.navigateTo(`gists/${element.id}`);
          };

          let isSelected = () => {
            return this.currentRoutePath && this.currentRoutePath.join('/') === `gists/${element.id}`;
          };

          let category = element.category ? element.category.split(",") : ["Uncategorized"];
          let menuItem = new CollapsibleMenuItem(element.name, element.id, onClick, isSelected);

          category.forEach(c => {
            let categoryMenuItem = this.gists.find((cat: CollapsibleMenuItem) => cat.label === c);
            if (!categoryMenuItem) {
              categoryMenuItem = new CollapsibleMenuItem(c, "", null, null, null, true);
              this.gists.push(categoryMenuItem);
            }

            categoryMenuItem.subItems.push(menuItem);
          });
        });
      }
    },
      error => {
        // TODO: handle detector route not found
        if (error && error.status === 404) {
        }
      });
  }

  doesMatchCurrentRoute(expectedRoute: string) {
    return this.currentRoutePath && this.currentRoutePath.join('/') === expectedRoute;
  }

  openDocumentation() {
    window.open('https://app-service-diagnostics-docs.azurewebsites.net/api/Diagnostics.ModelsAndUtils.Models.Response.html#extensionmethods', '_blank');
  }
}

@Pipe({
  name: 'search',
  pure: false
})
export class SearchMenuPipe implements PipeTransform {
  transform(items: CollapsibleMenuItem[], searchString: string) {
    return searchString && items ? items.filter(item => item.label.toLowerCase().indexOf(searchString.toLowerCase()) >= 0) : items;
  }
}
