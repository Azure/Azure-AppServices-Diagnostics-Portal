import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationExtras,
  Params,
  Router
} from '@angular/router';
import { DetectorMetaData } from 'diagnostic-data';
import { Observable, forkJoin, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { CacheService } from '../../../shared/services/cache.service';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  concat,
  delay,
  map,
  mergeMap,
  retry,
  retryWhen,
  take
} from 'rxjs/operators';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { AdalService } from 'adal-angular4';
import { SearchService } from '../services/search.service';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'resource-home',
  templateUrl: './resource-home.component.html',
  styleUrls: ['./resource-home.component.scss']
})
export class ResourceHomeComponent implements OnInit {
  currentRoutePath: string[];
  categories: CategoryItem[] = [];
  categoryLoaded: boolean = false;
  resource: any;
  keys: string[];
  activeCategoryName: string = undefined;
  activeRow: number = undefined;

  authorsList: string[] = [];
  detectorsWithSupportTopics: DetectorMetaData[];
  detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];

  supportTopics: SupportTopicItem[] = [];
  supportTopicsLoaded: boolean = false;
  supportTopicL2Images: { [name: string]: any } = {};
  viewType: string = 'category';

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _http: HttpClient,
    private _resourceService: ResourceService,
    private _diagnosticService: ApplensDiagnosticService,
    private _supportTopicService: ApplensSupportTopicService,
    private _cacheService: CacheService,
    private _telemetryService: TelemetryService,
    public _searchService: SearchService,
    private _adalService: AdalService
  ) {}

  ngOnInit() {
    this._searchService.resourceHomeOpen = true;
    this.viewType = this._activatedRoute.snapshot.params['viewType'];
    this._resourceService.getCurrentResource().subscribe((resource) => {
      if (resource) {
        this.resource = resource;
        this.keys = Object.keys(this.resource);
      }
    });

    this._supportTopicService
      .getSupportTopics()
      .subscribe((supportTopics: SupportTopicResult[]) => {
        supportTopics.forEach((supportTopic) => {
          let supportTopicL2Name = supportTopic.supportTopicL2Name;
          this._supportTopicService
            .getCategoryImage(supportTopicL2Name)
            .subscribe((iconString) => {
              this.supportTopicL2Images[supportTopicL2Name] = iconString;
              let item = new SupportTopicItem(
                supportTopic.supportTopicL2Name,
                supportTopic.productId,
                'Detector',
                supportTopic.supportTopicId,
                supportTopic.supportTopicL3Name,
                supportTopic.supportTopicPath
              );
              let suppportTopicItem = this.supportTopics.find(
                (sup: SupportTopicItem) =>
                  supportTopic.supportTopicL2Name === sup.supportTopicL2Name
              );

              if (!suppportTopicItem) {
                suppportTopicItem = new SupportTopicItem(
                  supportTopic.supportTopicL2Name,
                  supportTopic.productId,
                  'Detector',
                  supportTopic.supportTopicId,
                  null,
                  null,
                  iconString
                );
                this.supportTopics.push(suppportTopicItem);
              }

              suppportTopicItem.subItems.push(item);
            });
        });

        this.supportTopicsLoaded = true;
      });

    const detectorsWithSupportTopics = this._diagnosticService
      .getDetectors()
      .pipe(
        map((detectors: DetectorMetaData[]) => {
          this.detectorsWithSupportTopics = detectors.filter(
            (detector) =>
              detector.supportTopicList && detector.supportTopicList.length > 0
          );
          return this.detectorsWithSupportTopics;
        })
      );

    const publicDetectors = this._diagnosticService.getDetectors('', false);

    forkJoin(detectorsWithSupportTopics, publicDetectors).subscribe(
      (detectorLists) => {
        detectorLists.forEach((detectorList: DetectorMetaData[]) => {
          detectorList.forEach((detector) => {
            if (
              !this.detectorsPublicOrWithSupportTopics.find(
                (existingDetector) => existingDetector.id === detector.id
              )
            ) {
              this.detectorsPublicOrWithSupportTopics.push(detector);
            }
          });
        });

        this.detectorsPublicOrWithSupportTopics.forEach((element) => {
          let onClick = () => {
            this.navigateTo(`detectors/${element.id}`);
          };

          let isSelected = () => {
            return (
              this.currentRoutePath &&
              this.currentRoutePath.join('/') === `detectors/${element.id}`
            );
          };

          let categoryName = element.category;
          if (categoryName) {
            this._supportTopicService
              .getCategoryImage(categoryName)
              .subscribe((iconString) => {
                let menuItem = new CategoryItem(
                  element.name,
                  element.description,
                  element.author,
                  onClick,
                  isSelected
                );
                let categoryMenuItem = this.categories.find(
                  (cat: CategoryItem) => cat.label === element.category
                );

                if (!categoryMenuItem) {
                  categoryMenuItem = new CategoryItem(
                    element.category,
                    null,
                    null,
                    null,
                    null,
                    iconString
                  );

                  this.categories.push(categoryMenuItem);
                }

                categoryMenuItem.subItems.push(menuItem);
              });
          }
        });
        let alias =
          Object.keys(this._adalService.userInfo.profile).length > 0
            ? this._adalService.userInfo.profile.upn
            : '';
        let userId = alias.replace('@microsoft.com', '').toLowerCase();
        this._telemetryService.logPageView(TelemetryEventNames.HomePageLoaded, {
          numCategories: this.categories.length.toString(),
          userId: userId
        });

        if (detectorLists[1]) {
          this.categoryLoaded = true;
        }
      }
    );
  }

  triggerSearch() {
    this._searchService.searchTerm = this._searchService.searchTerm.trim();
    if (
      this._searchService.searchIsEnabled &&
      this._searchService.searchTerm &&
      this._searchService.searchTerm.length > 3
    ) {
      this.navigateTo(
        `../../search`,
        { searchTerm: this._searchService.searchTerm },
        'merge'
      );
    }
  }

  navigateToCategory(category: CategoryItem) {
    this._telemetryService.logEvent(TelemetryEventNames.CategoryCardClicked, {
      category: category.label
    });
    this.navigateTo(`../../categories/${category.label}`);
  }

  navigateToSupportTopic(supportTopic: SupportTopicItem) {
    this.navigateTo(`../../supportTopics/${supportTopic.supportTopicL2Name}`);
  }

  navigateTo(path: string, queryParams?: any, queryParamsHandling?: any) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: queryParamsHandling || 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute,
      queryParams: queryParams
    };

    this._router.navigate([path], navigationExtras);
  }

  selectView(type: string) {
    this.viewType = type;
    this.navigateTo(`../${type}/`);
  }

  ngOnDestroy() {
    this._searchService.resourceHomeOpen = false;
  }
}

export class CategoryItem {
  label: string;
  description: string;
  author: string;
  onClick: Function;
  subItems: CategoryItem[];
  isSelected: Function;
  icon: string;

  constructor(
    label: string,
    description: string,
    author: string,
    onClick: Function,
    isSelected: Function,
    icon: string = null,
    subItems: CategoryItem[] = []
  ) {
    this.label = label;
    this.description = description;
    this.author = author;
    this.onClick = onClick;
    this.subItems = subItems;
    this.isSelected = isSelected;
    this.icon = icon;
  }
}

export class SupportTopicResult {
  productId: string;
  supportTopicId: string;
  productName: string;
  supportTopicL2Name: string;
  supportTopicL3Name: string;
  supportTopicPath: string;
}

export class SupportTopicItem {
  supportTopicL2Name: string;
  detectorType: string;
  subItems: SupportTopicItem[];
  pesId: string;
  supportTopicId: string;
  supportTopicL3Name: string;
  supportTopicPath: string;
  icon: string;
  detectorId: string;
  detectorName: string;
  detectorInternal: boolean;

  constructor(
    supportTopicL2Name: string,
    pesId: string,
    detectorType: string,
    supportTopicId: string,
    supportTopicL3Name: string,
    supportTopicPath: string,
    icon: string = '',
    subItems: SupportTopicItem[] = [],
    detectorId: string = '',
    detectorName: string = '',
    detectorInternal: boolean = true
  ) {
    this.supportTopicL2Name = supportTopicL2Name;
    this.pesId = pesId;
    this.detectorType = detectorType;
    this.supportTopicId = supportTopicId;
    this.supportTopicL3Name = supportTopicL3Name;
    this.supportTopicPath = supportTopicPath;
    this.icon = icon;
    this.subItems = subItems;
    this.detectorId = detectorId;
    this.detectorName = detectorName;
    this.detectorInternal = detectorInternal;
  }
}
