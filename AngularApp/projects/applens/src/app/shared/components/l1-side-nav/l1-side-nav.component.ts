import { Component, Input, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { UriUtilities } from 'diagnostic-data';
import { IDialogContentProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { filter } from 'rxjs/operators';
import { ApplensGlobal } from '../../../applens-global';
import { ApplensDocsComponent } from '../../../modules/dashboard/applens-docs/applens-docs.component';
import { DashboardContainerComponent } from '../../../modules/dashboard/dashboard-container/dashboard-container.component';
import { L2SideNavType } from '../../../modules/dashboard/l2-side-nav/l2-side-nav';
import { l1SideNavExpandWidth, l1SideNavCollapseWidth } from './l1-side-nav';

const iconBasePath = "assets/img/applens-skeleton/side-nav";

@Component({
  selector: 'l1-side-nav',
  templateUrl: './l1-side-nav.component.html',
  styleUrls: ['./l1-side-nav.component.scss']
})
export class L1SideNavComponent implements OnInit {
  isExpand: boolean = false;
  get sideNavWidth() {
    return this.isExpand ? l1SideNavExpandWidth : l1SideNavCollapseWidth
  }
  sideItems: SideNavItem[] = [
    {
      type: L1SideNavItemType.Resource,
      displayName: "Resource",
      iconPath: `${iconBasePath}/resource.svg`,
      subItems: [
        {
          type: L1SideNavItemType.Overview,
          displayName: "Overview",
          iconPath: `${iconBasePath}/overview.svg`,
          click: () => {
            this.navigate("");
          }
        }
        , {
          type: L1SideNavItemType.Detectors,
          displayName: "Detectors",
          iconPath: `${iconBasePath}/detectors.svg`,
          click: () => {
            this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.Detectors);
          }
        }
      ]
    },
    {
      type: L1SideNavItemType.Docs,
      displayName: "Documentation",
      iconPath: `${iconBasePath}/docs.svg`,
      click: () => {
        this.navigate("/docs")
      }
    }
  ];
  currentHightLightItem: L1SideNavItemType = null;
  showDialog: boolean = false;
  dialogTitle: string = "Are you sure to select a new resource?";
  dialogSubText: string = "You’ll lose access to current resource’s data. Are you sure to select a new resource?";
  dialogContentStyles: IDialogContentProps['styles'] = {
    title: {
      fontSize: "18px",
      lineHeight: "24px",
      color: "#323130",
      fontWeight: "600"
    },
    subText: {
      fontSize: "13px",
      lineHeight: "18px",
      fontWeight: "600"
    },
    inner: {
      textAlign: "left"
    }
  }

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _applensGlobal: ApplensGlobal) { }

  ngOnInit() {
    this._applensGlobal.expandL1SideNavSubject.subscribe(isExpand => {
      this.isExpand = isExpand;
    });

    // this._activatedRoute.params.subscribe(param => {
    //   console.log(param);
    // })
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(e => {
      this.getCurrentHighLightItem();
    });
  }
  getCurrentHighLightItem(): L1SideNavItemType {
    const childRoute = this._activatedRoute.firstChild;
    if (childRoute && (childRoute.snapshot.params["analysisId"] || childRoute.snapshot.params["detector"])) {
      return L1SideNavItemType.Detectors;
    } else if (childRoute.component === DashboardContainerComponent) {
      return L1SideNavItemType.Overview;
    } else if (childRoute.component === ApplensDocsComponent) {
      return L1SideNavItemType.Docs;
    }

    return null;
  }

  clickSideItem(item: SideNavItem) {
    this.dismissL2SideNav();
    let sideItem = item.subItems && item.subItems.length > 0 ? item.subItems[0] : item;

    if (typeof sideItem.click === "function") {
      sideItem.click();
    }
  }

  dismissDialog() {
    this.showDialog = false;
  }

  navigateToLandingPage() {
    window.location.href = "/"
    this.dismissDialog();
  }

  dismissL2SideNav() {
    this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.None);
  }

  private navigate(path: string) {
    if (this._activatedRoute.parent) {
      const params = this._activatedRoute.parent.snapshot.params;

      const subscriptionId = params["subscriptionId"];
      const resourceGroup = params["resourceGroup"];
      const provider = params["provider"];
      const resourceTypeName = params["resourceTypeName"];
      const resourceName = params["resourceName"];

      const url = `subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/${provider}/${resourceTypeName}/${resourceName}/${path}`;

      const queryParams = UriUtilities.removeChildDetectorStartAndEndTime(this._activatedRoute.snapshot.queryParams);

      this._router.navigate([url], {
        queryParams: queryParams
      });
    }
  }

  toggleSideNavExpand() {
    this._applensGlobal.expandL1SideNavSubject.next(!this.isExpand);
  }
}

interface SideNavItem {
  type: L1SideNavItemType;
  displayName: string;
  iconPath: string;
  click?: () => void,
  subItems?: SideNavItem[],
}

enum L1SideNavItemType {
  Home,
  Resource,
  Overview,
  Detectors,
  Docs
}