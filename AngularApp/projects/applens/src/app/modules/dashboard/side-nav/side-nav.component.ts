import { AdalService } from 'adal-angular4';
import { filter } from 'rxjs/operators';
import { Component, OnInit, PipeTransform, Pipe, ViewChild, ElementRef, HostListener, Input } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { ResourceService } from '../../../shared/services/resource.service';
import { CollapsibleMenuItem } from '../../../collapsible-menu/components/collapsible-menu-item/collapsible-menu-item.component';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DetectorType, UriUtilities } from 'diagnostic-data';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { CheckboxVisibility, IDetailsListProps, IGroup, IGroupedListProps, IListProps, ISearchBoxProps, ISelection, ITextFieldProps, Selection, SelectionMode } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../applens-global';
import { FabSearchBoxComponent } from '@angular-react/fabric';
import { L2SideNavType } from '../l2-side-nav/l2-side-nav';

@Component({
  selector: 'side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {

  L2SideNavType = L2SideNavType;
  type: L2SideNavType;

  get isGroupList() {
    return this.type === L2SideNavType.Detectors || this.type === L2SideNavType.Gits;
  }

  // userId: string = "";

  detectorsLoading: boolean = true;

  currentRoutePath: string[];

  categories: CollapsibleMenuItem[] = [];
  analysisTypes: CollapsibleMenuItem[] = [];

  gists: CollapsibleMenuItem[] = [];

  searchValue: string;

  contentHeight: string;

  getDetectorsRouteNotFound: boolean = false;

  searchBoxIcon: ITextFieldProps["iconProps"] = {
    iconName: "Zoom",
  }

  @ViewChild(FabSearchBoxComponent, { static: false }) fabSearchBox: any;
  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _adalService: AdalService, private _diagnosticApiService: ApplensDiagnosticService, public resourceService: ResourceService, private _telemetryService: TelemetryService, private _applensGlobal: ApplensGlobal) {
  }

  @HostListener('click', ['$event.target'])
  onHandleClickGroupTitle(ele: HTMLElement) {

    const parentElement = ele.parentElement;
    this.toggleGroupCollapsible(parentElement);
  }

  @HostListener('keydown.Enter', ['$event.target'])
  onHandleEnterGroupTitle(ele: HTMLElement) {
    if (ele.firstElementChild && ele.firstElementChild.lastElementChild) {
      const element = <HTMLElement>ele.firstElementChild.lastElementChild;
      this.toggleGroupCollapsible(element);
    }
  }

  createNew: CollapsibleMenuItem[] = [
    {
      label: 'Your Detectors',
      id: "",
      onClick: () => {
        // this.navigateToUserPage();
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

  onShouldVirtualize = (props: IListProps) => {
    return false;
  }

  searchBoxStyles: ISearchBoxProps['styles'] = {
    root: {
      width: "250px"
    }
  }

  selectionMode = SelectionMode.single;
  checkboxVisibility = CheckboxVisibility.hidden;

  cellStyleProps: IDetailsListProps['cellStyleProps'] = {
    cellLeftPadding: 0,
    cellRightPadding: 0,
    cellExtraRightPadding: 0
  }


  collapsibleItemListCopy: CollapsibleMenuItem[] = [];
  collapsibleItemList: CollapsibleMenuItem[] = [];
  groups: IGroup[] = [];

  ngOnInit() {
    this._applensGlobal.openL2SideNavSubject.subscribe(type => {
      this.type = type;
      this.initialize();
    })

    this.getCurrentRoutePath();

    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.getCurrentRoutePath();
    });
  }

  focusSearchBox() {
    const input = this.fabSearchBox.elementRef.nativeElement.firstChild.lastElementChild;
    input.autocomplete = "off";
  }

  private getCurrentRoutePath() {
    this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
  }

  navigateTo(path: string) {
    const queryParams = UriUtilities.removeChildDetectorStartAndEndTime(this._activatedRoute.snapshot.queryParams);
    let navigationExtras: NavigationExtras = {
      queryParams: queryParams,
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };

    this._router.navigate(path.split('/'), navigationExtras);
  }

  initialize() {
    switch (this.type) {
      case L2SideNavType.Detectors:
        this.initializeDetectors();
        break;
      case L2SideNavType.Develop_Detectors:
        this.initializeCreateDetectors();
        break;
      case L2SideNavType.Gits:
        this.initializeGists();
        break;
    }
  }

  private initializeGists() {
    this._diagnosticApiService.getGists().subscribe(gistList => {
      if (gistList) {
        this.addGistCategory();
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

        this.initialGroupList(this.gists);
      }
    },
      error => {
        // TODO: handle detector route not found
        if (error && error.status === 404) {
        }
      });
  }

  private addGistCategory() {
    const gistCategory = new CollapsibleMenuItem("Gists", "Gists", null, null, null, true);
    const createGistItem =
      new CollapsibleMenuItem("Create Gist",
        "Create Gist",
        () => {
          this.navigateTo('createGist');
        },
        () => { },
        "", true, [], "");
    const yourGists =
      new CollapsibleMenuItem("Your Gist",
        "Your Gist",
        () => {
          let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
          const userId: string = alias.replace('@microsoft.com', '');
          if (userId.length > 0) {
            this.navigateTo(`users/${userId}/gists`);
          }
        },
        () => { },
        "", true, [], "");
    gistCategory.subItems = [createGistItem, yourGists];
    if (this.gists.findIndex(g => g.label === gistCategory.label) < 0) {
      this.gists.unshift(gistCategory);
    }
  }


  private initializeDetectors() {
    this._diagnosticApiService.getDetectors().subscribe(detectorList => {
      const analysisMenuItem = new CollapsibleMenuItem("Analysis", "", null, null, null, true);
      if (detectorList) {
        detectorList.forEach(element => {
          let onClick = () => {
            this._telemetryService.logEvent(TelemetryEventNames.SideNavigationItemClicked, { "elementId": element.id });
            this.navigateTo(`detectors/${element.id}`);
            this.dismissL2SideNav();
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
              this.dismissL2SideNav();
            };

            let isSelectedAnalysis = () => {
              this.getCurrentRoutePath();
              return this.currentRoutePath && this.currentRoutePath.join('/') === `analysis/${element.id}`;
            }

            let analysisSubMenuItem = new CollapsibleMenuItem(element.name, element.id, onClickAnalysisParent, isSelectedAnalysis, null, true, [], element.supportTopicList && element.supportTopicList.length > 0 ? element.supportTopicList.map(x => x.id).join(",") : null);
            analysisMenuItem.subItems.push(analysisSubMenuItem);
          }


        });
        this.categories.push(analysisMenuItem);
        this.categories = this.categories.sort((a, b) => {
          if (a.label === 'Analysis') return -1;
          if (a.label === 'Uncategorized') return 1;
          return a.label > b.label ? 1 : -1;
        });

        this.initialGroupList(this.categories);

        const analysisGroup = this.groups.find(g => g.name.toLowerCase() === "analysis");
        analysisGroup.isCollapsed = false;

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
  }

  private initializeCreateDetectors() {
    const createNewDetector = new CollapsibleMenuItem("Create Detector",
      "Create Detector",
      () => {
        this.navigateTo('create');
      },
      () => { },
      "", true, [], "");

    const yourDetectors = new CollapsibleMenuItem("Your Detectors",
      "Your Detectors",
      () => {
        let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
        const userId: string = alias.replace('@microsoft.com', '');
        if (userId.length > 0) {
          this.navigateTo(`users/${userId}/detectors`);
        }
      },
      () => { },
      "", true, [], "");
    this.collapsibleItemList = [createNewDetector, yourDetectors];
  }

  doesMatchCurrentRoute(expectedRoute: string) {
    return this.currentRoutePath && this.currentRoutePath.join('/') === expectedRoute;
  }

  // openDocumentation() {
  //   window.open('https://app-service-diagnostics-docs.azurewebsites.net/api/Diagnostics.ModelsAndUtils.Models.Response.html#extensionmethods', '_blank');
  // }

  updateSearchValue(e: { newValue: string }) {
    const searchValue = e.newValue;
    this.searchValue = searchValue;
    this.updateListGroups(searchValue);

  }

  updateListGroups(searchValue: string) {
    this.collapsibleItemList = this.collapsibleItemListCopy.filter(item => {
      return item.label.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0 || item.id.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0 || item.metadata && item.metadata.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0;
    });

    this.groups = this.getGroupsFromList(this.collapsibleItemList);
    this.groups.forEach(g => g.isCollapsed = false);


  }

  dismissL2SideNav() {
    this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.None);
  }

  private flatCategoriesList(categories: CollapsibleMenuItem[]) {
    const itemList: CollapsibleMenuItem[] = [];
    for (const category of categories) {
      if (category.subItems && category.subItems.length > 0) {
        for (const item of category.subItems) {
          item.group = category.label;
          itemList.push(item);
        }
      }
    }
    return itemList;
  }

  private getGroupsFromList(list: CollapsibleMenuItem[]): IGroup[] {
    const groups: IGroup[] = [];
    if (list.length === 0) return groups;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const group = groups.find(g => g.name.toLowerCase() === item.group.toLowerCase());
      if (!group) {
        groups.push({
          key: item.group,
          name: item.group,
          startIndex: i,
          count: 1,
          isCollapsed: true
        });
      } else {
        group.count += 1;
      }
    }

    //Add an empty group in last, for fixing toggling last group expand/collapsible all groups bug 
    groups.push({
      key: "empty",
      name: "empty",
      startIndex: list.length - 1,
      count: 0,
      isCollapsed: true
    });

    return groups;
  }

  private initialGroupList(items: CollapsibleMenuItem[]) {
    this.collapsibleItemList = this.flatCategoriesList(items);
    this.collapsibleItemListCopy = [...this.collapsibleItemList];
    this.groups = this.getGroupsFromList(this.collapsibleItemList);
  }

  listInvokedHandler(e: { item: CollapsibleMenuItem }) {
    e.item.onClick();
  }

  private toggleGroupCollapsible(ele: HTMLElement) {

    const classNameList = ele.className.split(" ");
    if (classNameList.findIndex(name => name === "ms-GroupHeader-title") === -1) return;
    const groupName = ele.firstElementChild.innerHTML;

    const groupIndex = this.groups.findIndex(g => g.name.toLowerCase() === groupName.toLowerCase());
    if (groupIndex > -1) {
      const isCollapsed = this.groups[groupIndex].isCollapsed;
      this.groups[groupIndex].isCollapsed = !isCollapsed;
    }
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
