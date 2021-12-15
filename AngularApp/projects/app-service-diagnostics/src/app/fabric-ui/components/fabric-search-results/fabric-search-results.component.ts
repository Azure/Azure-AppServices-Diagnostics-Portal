import { Component, HostListener, ViewChild, ElementRef, Renderer2 } from "@angular/core";
import { Feature } from "../../../shared-v2/models/features";
import { FeatureService } from "../../../shared-v2/services/feature.service";
import { LoggingV2Service } from "../../../shared-v2/services/logging-v2.service";
import { NotificationService } from "../../../shared-v2/services/notification.service";
import { Globals } from "../../../globals";
import { SelectionMode } from 'office-ui-fabric-react/lib/DetailsList'
import { Router } from "@angular/router";
import { TelemetryService, icons } from "diagnostic-data";

enum BlurType {
  //click other place to close panel
  Blur,
  //use tab or cross icon(on right) will not trigger blur
  None
}
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
  searchLogTimout: any;
  showSearchResults: boolean;
  clickSearchBox: BlurType = BlurType.Blur;
  //Only ture when press ESC and no word in search box,collapse search result.
  isEscape: boolean = false;
  selectionMode = SelectionMode.none;
  isInCategory: boolean;
  get inputAriaLabel(): string {
    const resultCount = this.features.length;
    let searchResultAriaLabel = "";
    if (resultCount >= 1) {
      searchResultAriaLabel = resultCount > 1 ? `Found ${resultCount} Results` : `Found ${resultCount} Result`;
    } else {
      searchResultAriaLabel = `No results were found.`;
    }
    return `${searchResultAriaLabel}, Press Escape to clear search bar`;
  }

  @HostListener('mousedown', ['$event.target'])
  onClick(ele: HTMLElement) {
    //If is cross icon in search box
    if ((ele.tagName === "DIV" && ele.className.indexOf("ms-SearchBox-clearButton") > -1) ||
      (ele.tagName === "BUTTON" && ele.className.indexOf("ms-Button--icon") > -1) ||
      (ele.tagName === "DIV" && ele.className.indexOf("ms-Button-flexContainer") > -1) ||
      (ele.tagName === "I" && ele.className.indexOf("ms-Button-icon") > -1)) {
      this.clickSearchBox = BlurType.None;
      //Async set to BlurType.Blur,so after clean result it will set to Blur for next onBlur action
      setTimeout(() => { this.clickSearchBox = BlurType.Blur }, 0);
    }
    else if (this.isInCategory) {
      this.clickSearchBox = BlurType.Blur;
    }
    else {
      this.clickSearchBox = BlurType.Blur;
    }
  }

  @HostListener('keydown.Tab', ['$event.target'])
  onKeyDown(ele: HTMLElement) {
    if (ele.tagName === "INPUT") {
      if (this.isInCategory) {
        this.clickSearchBox = BlurType.Blur;
        this.onBlurHandler();
      } else {
        this.clickSearchBox = BlurType.None;
      }
    }
    //If in genie or detailLists then blur after tab
    else if (ele.innerText === "Ask chatbot Genie" ||
      ele.className.indexOf("ms-FocusZone") > -1) {
      this.clickSearchBox = BlurType.Blur;
      this.onBlurHandler();
    }
    else {
      this.clickSearchBox = BlurType.Blur;
    }
  }

  //Remove after no longer use search in command bar
  @HostListener('keydown.arrowright', ['$event.target'])
  onArrowLeft(ele: HTMLElement) {
    if (this.isInCategory) {
      this.clickSearchBox = BlurType.None;
      const list = <any[]>Array.from(ele.parentElement.children);
      const index = list.findIndex(e => ele === e);
      if (ele.tagName === "A" && this.features.length > 0 && index === this.features.length - 1) {
        this.clickSearchBox = BlurType.Blur;
        this.onBlurHandler();
      }

      if (this.features.length === 0 && ele.innerHTML.includes('Genie')) {
        this.clickSearchBox = BlurType.Blur;
        this.onBlurHandler();
      }
    }
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
    this._notificationService.dismiss();
    this._logSearchSelection(feature);
    feature.clickAction();
  }

  private _logSearch() {
    this.telemetryService.logEvent('Search', {
      'SearchValue': this.searchValue,
      'Location': this.isInCategory ? 'CategoryOverview' : 'LandingPage'
    });
  }

  private _logSearchSelection(feature: Feature) {
    this._logSearch();
    this.telemetryService.logEvent('SearchItemClicked', {
      'SearchValue': this.searchValue,
      'SelectionId': feature.id,
      'SelectionName': feature.name,
      'Location': this.isInCategory ? 'CategoryOverview' : 'LandingPage'
    });
  }

  updateSearchValue(searchValue: { newValue: any }) {
    this.showSearchResults = !this.isEscape;

   if (!!searchValue && !!searchValue.newValue && !!searchValue.newValue.currentTarget && !!searchValue.newValue.currentTarget.value)
   {
        this.searchValue = searchValue.newValue.currentTarget.value;
   }

    if (this.searchLogTimout) {
      clearTimeout(this.searchLogTimout);
    }

    this.searchLogTimout = setTimeout(() => {
      this._logSearch();
    }, 5000);
    this.features = this.featureService.getFeatures(this.searchValue);
    this.isEscape = false;

    //remove tab for right Cross in search bar
    //need async so when type first letter we can wait cross show up then disable it
    setTimeout(() => {
      const crossBtn: any = document.querySelector('.ms-SearchBox-clearButton button');
      if (crossBtn) {
        crossBtn.tabIndex = -1;
      }
    });
  }

  onSearchBoxFocus() {
    this.showSearchResults = true;
    this.features = this.featureService.getFeatures(this.searchValue);
    //Disable AutoComplete
    if (document.querySelector("#fabSearchBox input")) {
      const input = <any>document.querySelector("#fabSearchBox input");
      input.autocomplete = "off";
    }
  }

  clearSearch() {
    this.searchValue = "";
    this.features = this.featureService.getFeatures(this.searchValue);
  }

  clearSearchWithKey() {
    //only true when trigger ESC
    this.isEscape = this.searchValue === "";
  }

  onBlurHandler() {
    switch (this.clickSearchBox) {
      case BlurType.Blur:
        this.clearSearch();
        this.showSearchResults = false;
        break;
      case BlurType.None:
        break;
      default:
        break;
    }
  }
  openGeniePanel() {
    this.isEscape = true;
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
    (<HTMLInputElement>document.querySelector('#fabSearchBox input')).focus();
  }
  clickOutside() {
    this.clickSearchBox = BlurType.Blur;
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
