import { Component, HostListener, ViewChild, ElementRef, Renderer2 } from "@angular/core";
import { Feature } from "../../../shared-v2/models/features";
import { FeatureService } from "../../../shared-v2/services/feature.service";
import { LoggingV2Service } from "../../../shared-v2/services/logging-v2.service";
import { NotificationService } from "../../../shared-v2/services/notification.service";
import { Globals } from "../../../globals";
import { SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { Router } from "@angular/router";
import { TelemetryService, icons } from "diagnostic-data";
@Component({
  selector: 'fabric-search-results',
  templateUrl: './fabric-search-results.component.html',
  styleUrls: ['./fabric-search-results.component.scss']
})
export class FabricSearchResultsComponent {
  searchPlaceHolder: string = "Search for common problems or tools";
  searchValue: string = "";
  resultCount: number;
  features: Feature[] = [];
  searchLogTimeout: any;
  hideSearchIcon: boolean = false;
  searchBoxInFocus: boolean = false;
  isBlur = true;
  showSearchResults: boolean;
  selectionMode = SelectionMode.none;
  isInCategory: boolean;
  get inputAriaLabel(): string {
    const resultCount = this.features.length;
    let searchResultAriaLabel = "";
    if (resultCount >= 1) {
      searchResultAriaLabel = resultCount > 1 ? `Found ${resultCount} Results` : `Found ${resultCount} Result`;
    } else {
      searchResultAriaLabel = `No results were found`;
    }
    return `${searchResultAriaLabel}, Press Escape to clear search bar`;
  }

  @HostListener('keydown.Tab', ['$event.target'])
  onKeyDown(ele: HTMLElement) {
    if (this.isInCategory) {
      this.isBlur = true;
      this.onBlurHandler();
    } else {
      this.checkIfNeedToBlur(ele)
    }
  }

  //Remove after no longer use search in command bar
  @HostListener('keydown.arrowright', ['$event.target'])
  onArrowLeft(ele: HTMLElement) {
    if(!this.isInCategory) return;
    this.checkIfNeedToBlur(ele);
  }


  @ViewChild('fabSearchResult', { static: true }) fabSearchResult: ElementRef
  constructor(public featureService: FeatureService, private _logger: LoggingV2Service, private _notificationService: NotificationService, private globals: Globals, private router: Router, private render: Renderer2, private telemetryService: TelemetryService) {
    this.isInCategory = this.router.url.includes('/categories');

    this.render.listen('window', 'click', (e: Event) => {
      if (!this.fabSearchResult.nativeElement.contains(e.target)) {
        this.clickOutside();
      }
    });
    this.render.listen('window', 'keydown.Tab', (e: Event) => {
      if (!this.fabSearchResult.nativeElement.contains(e.target)) {
        this.clickOutside();
      }
    });
  }

  navigateToFeature(feature: Feature) {
    this.clickOutside();
    this._notificationService.dismiss();
    this._logSearchSelection(feature);
    feature.clickAction();
  }

  private _logSearch() {
    this.telemetryService.logEvent('Search', {
      'SearchValue': this.searchValue,
      'Place': this.isInCategory ? 'CategoryOverview' : 'LandingPage'
    });
  }

  private _logSearchSelection(feature: Feature) {
    this._logSearch();
    this.telemetryService.logEvent('SearchItemClicked', {
      'SearchValue': this.searchValue,
      'SelectionId': feature.id,
      'DetectorName': feature.name,
      'CategoryName': feature.category,
      'Place': this.isInCategory ? 'CategoryOverview' : 'LandingPage'
    });
  }

  updateSearchValue(searchValue: string) {
    this.showSearchResults = true;
    this.searchValue = searchValue ?? this.searchValue;

    if (this.searchLogTimeout) {
      clearTimeout(this.searchLogTimeout);
    }

    this.searchLogTimeout = setTimeout(() => {
      this._logSearch();
    }, 5000);
    this.features = this.featureService.getFeatures(this.searchValue);
  }

  onSearchBoxFocus() {
    this.isBlur = true;
    this.searchBoxInFocus = true;
    this.showSearchResults = true;
    this.hideSearchIcon = true;
    this.features = this.featureService.getFeatures(this.searchValue);
  }

  clearSearchWithKey() {
    if (this.searchValue.length > 0) {
      this.clearSearch();
    } else {
      this.showSearchResults = false;
    }
  }

  clearSearch() {
    this.searchValue = "";
    this.features = this.featureService.getFeatures(this.searchValue);
  }

  onBlurHandler() {
    if (!this.isBlur) return;
    this.hideSearchIcon = false;
    this.searchBoxInFocus = false;
    this.clearSearch();
    this.showSearchResults = false;
  }

  checkIfNeedToBlur(ele: HTMLElement) {
    this.isBlur = false;
    const list = <any[]>Array.from(ele.parentElement.children);
    const index = list.findIndex(e => ele === e);

    if (ele.tagName === "A" && this.features.length > 0 && index === this.features.length - 1) {
      this.isBlur = true;
      this.onBlurHandler();
    }

    if (this.features.length === 0) {
      this.isBlur = true;
      this.onBlurHandler();
    }
  }


  openGeniePanel() {
    this.globals.openGeniePanel = true;
  }

  getIconImagePath(name: string) {
    const basePath = "../../../../assets/img/detectors";
    const fileName = icons.has(name) ? name : 'default';
    return `${basePath}/${fileName}.svg`;
  }

  invokeHandler(selected: { item: Feature }) {
    this.navigateToFeature(selected.item);
  }

  escapeHandler() {
    this.clearSearchWithKey();
    (<HTMLInputElement>document.querySelector('#fabSearchBox')).focus();
  }
  clickOutside() {
    this.onBlurHandler();
  }

  getResultAriaLabel(index: number): string {
    const feature = this.features[index];
    if (feature && feature.name) {
      return `${index + 1} of ${this.features.length},${feature.name}`;
    } else {
      return `${index + 1} of ${this.features.length}`;
    }
  }
}
