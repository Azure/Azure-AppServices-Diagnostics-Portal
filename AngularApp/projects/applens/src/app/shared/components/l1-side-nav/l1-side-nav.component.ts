import { Component, Input, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UriUtilities } from 'diagnostic-data';
import { IDialogContentProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../applens-global';
import { DashboardContainerComponent } from '../../../modules/dashboard/dashboard-container/dashboard-container.component';
import { L2SideNavType } from '../../../modules/dashboard/l2-side-nav/l2-side-nav.component';

@Component({
  selector: 'l1-side-nav',
  templateUrl: './l1-side-nav.component.html',
  styleUrls: ['./l1-side-nav.component.scss']
})
export class L1SideNavComponent implements OnInit {
  @Input() isInLandingPage: boolean = false;
  sideItems: SideNavItem[] = [
    {
      type: L1SideNavItemType.Home,
      displayName: L1SideNavItemType[L1SideNavItemType.Home],
      enabledInLandingPage: true,
      click: () => {
        this.dismissL2SideNav();
        if (this.isInLandingPage) return;
        this.showDialog = true;
      }
    },
    {
      type: L1SideNavItemType.Overview,
      displayName: L1SideNavItemType[L1SideNavItemType.Overview],
      enabledInLandingPage: false,
      click: () => {
        this.dismissL2SideNav();
        if (this.isInLandingPage) return;
        if (this._activatedRoute.parent) {
          const params = this._activatedRoute.parent.snapshot.params;

          const subscriptionId = params["subscriptionId"];
          const resourceGroup = params["resourceGroup"];
          const provider = params["provider"];
          const resourceTypeName = params["resourceTypeName"];
          const resourceName = params["resourceName"];

          const url = `subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/${provider}/${resourceTypeName}/${resourceName}`;

          const queryParams = UriUtilities.removeChildDetectorStartAndEndTime(this._activatedRoute.snapshot.queryParams);

          this._router.navigate([url], {
            queryParams:queryParams
          });
        }

      }
    },
    {
      type: L1SideNavItemType.Detectors,
      displayName: L1SideNavItemType[L1SideNavItemType.Detectors],
      enabledInLandingPage: false,
      click: () => {
        if(this.isInLandingPage) return;
        this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.Detectors);
      }
    },
    // {
    //   type: L1SideNavType.Docs,
    //   displayName: L1SideNavType[L1SideNavType.Docs],
    //   enabledInLandingPage: true,
    //   click: () => {
    //     this.dismissL2SideNav();
    //   }
    // }
  ];
  currentHightLightItem:L1SideNavItemType = null;
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
    }
  }

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, @Optional() private _applensGlobal: ApplensGlobal) { }

  ngOnInit() {
  }

  getItemEnabled(item: SideNavItem): boolean {
    return !this.isInLandingPage || item.enabledInLandingPage;
  }

  getImageUrl(item: SideNavItem): string {
    const basePath = "../../../../assets/img/applens-skeleton/side-nav";
    const folder = this.getItemEnabled(item) ? 'enable' : 'disable';
    const file = L1SideNavItemType[item.type].toLowerCase();
    return `${basePath}/${folder}/${file}.svg`;
  }

  getCurrentHighLightItem(): L1SideNavItemType {
    if (this.isInLandingPage) {
      return L1SideNavItemType.Home;
    }
    const childRoute = this._activatedRoute.firstChild;
    if (childRoute && (childRoute.snapshot.params["analysisId"] || childRoute.snapshot.params["detector"])) {
      return L1SideNavItemType.Detectors;
    } else if (childRoute.component === DashboardContainerComponent) {
      return L1SideNavItemType.Overview;
    }

    return null;
  }

  private checkIsLandingPage() {
    const url = this._router.url.split("?")[0];
    return url === "/";
  }

  dismissDialog() {
    this.showDialog = false;
  }

  navigateToLandingPage() {
    //Some issue with Resource.service,for now refresh whole page
    // this._router.navigate(["/"]);
    window.location.href = "/"
    this.dismissDialog();
  }

  dismissL2SideNav() {
    this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.None);
  }
}

interface SideNavItem {
  type: L1SideNavItemType
  displayName: string;
  enabledInLandingPage: boolean,
  click: () => void,
}

enum L1SideNavItemType {
  Home,
  Overview,
  Detectors,
  Docs
}
