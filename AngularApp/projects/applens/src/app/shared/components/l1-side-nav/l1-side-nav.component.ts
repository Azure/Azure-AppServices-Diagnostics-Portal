import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { IDialogContentProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { filter } from 'rxjs/operators';
import { ApplensGlobal } from '../../../applens-global';
import { L2SideNavType } from '../../../modules/dashboard/l2-side-nav/l2-side-nav.component';

@Component({
  selector: 'l1-side-nav',
  templateUrl: './l1-side-nav.component.html',
  styleUrls: ['./l1-side-nav.component.scss']
})
export class L1SideNavComponent implements OnInit {
  sideItems: SideNavItem[] = [
    {
      name: L1SideNavType[L1SideNavType.Landing],
      displayName: L1SideNavType[L1SideNavType.Landing],
      enabledInLandingPage: true,
      click: () => {
        this.dismissL2SideNav();
        if(this.checkIsLandingPage()) return;
        this.showDialog = true;
      }
    },
    {
      name: L1SideNavType[L1SideNavType.Home],
      displayName: L1SideNavType[L1SideNavType.Home],
      enabledInLandingPage: false,
      click: () => {
        this.dismissL2SideNav();
        if(this.checkIsLandingPage()) return;
        if(this._activatedRoute.firstChild.firstChild.firstChild) {
          const params = this._activatedRoute.firstChild.firstChild.firstChild.snapshot.params;
          
          const subscriptionId = params["subscriptionId"];
          const resourceGroup = params["resourceGroup"];
          const provider = params["provider"];
          const resourceTypeName = params["resourceTypeName"];
          const resourceName = params["resourceName"];

          const url = `subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/${provider}/${resourceTypeName}/${resourceName}`;

          this._router.navigate([url],{
            queryParamsHandling: "preserve"
          });
        }

      }
    },
    {
      name: L1SideNavType[L1SideNavType.Detectors],
      displayName: L1SideNavType[L1SideNavType.Detectors],
      enabledInLandingPage: false,
      click: () => { 
        this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.Detectors);
      }
    },
    {
      name: L1SideNavType[L1SideNavType.Docs],
      displayName: L1SideNavType[L1SideNavType.Docs],
      enabledInLandingPage: true,
      click: () => {
        this.dismissL2SideNav();
      }
    }
  ];
  panelType: PanelType = PanelType.customNear;
  panelStyles: IPanelProps['styles'] = {
    main: {
      background: "#EAEAEA",
      boxShadow: "inset -1px 0px 0px rgba(0, 0, 0, 0.12)",
      marginTop: '50px',
    }
  };
  panelFocusTrapZoneProps: IPanelProps["focusTrapZoneProps"] = {
    disabled: true
  }
  showDialog: boolean = false;
  dialogTitle: string = "Are you sure to select a new resource?";
  dialogSubText: string = "You’ll lose access to current resource’s data. Are you sure to select a new resource?";
  dialogContentStyles:  IDialogContentProps['styles'] = {
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

  constructor(private _router: Router,private _activatedRoute:ActivatedRoute,private _applensGlobal:ApplensGlobal) { }

  ngOnInit() {
  }

  getItemEnabled(item: SideNavItem): boolean {
    const isInLandingPage = this.checkIsLandingPage();

    return !isInLandingPage || item.enabledInLandingPage;
  }

  getImageUrl(item: SideNavItem): string {
    const basePath = "../../../../assets/img/applens-skeleton/side-nav";
    const folder = this.getItemEnabled(item) ? 'enable' : 'disable';
    return `${basePath}/${folder}/${item.name.toLowerCase()}.svg`;
  }

  highlightNavIcon(url: string) {
    if (url === "/") return L1SideNavType.Landing;
    if (url.endsWith("/home/category")) return L1SideNavType.Home;
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
  name: string;
  displayName: string;
  enabledInLandingPage: boolean,
  click: () => void,
  disabled?: boolean,
  img?:string,
}

enum L1SideNavType {
  Landing,
  Home,
  Detectors,
  Docs
}
