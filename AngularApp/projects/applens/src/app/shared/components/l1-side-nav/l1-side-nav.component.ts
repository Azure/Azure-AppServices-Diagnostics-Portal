import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { IDialogContentProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'l1-side-nav',
  templateUrl: './l1-side-nav.component.html',
  styleUrls: ['./l1-side-nav.component.scss']
})
export class L1SideNavComponent implements OnInit {
  private isInLandingPage: boolean = true;
  openL2SideNavSubject:BehaviorSubject<any> = new BehaviorSubject<any>(true);
  sideItems: SideNavItem[] = [
    {
      name: SideNavItemName[SideNavItemName.Landing],
      displayName: SideNavItemName[SideNavItemName.Landing],
      enabledInLandingPage: true,
      click: () => {
        if(this.isInLandingPage) return;
        this.showDialog = true;
      }
    },
    {
      name: SideNavItemName[SideNavItemName.Home],
      displayName: SideNavItemName[SideNavItemName.Home],
      enabledInLandingPage: false,
      click: () => {
        if(this.isInLandingPage) return;
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
      name: SideNavItemName[SideNavItemName.Detectors],
      displayName: SideNavItemName[SideNavItemName.Detectors],
      enabledInLandingPage: false,
      click: () => { 
        this.openL2SideNavSubject.next(true);
      }
    },
    {
      name: SideNavItemName[SideNavItemName.Docs],
      displayName: SideNavItemName[SideNavItemName.Docs],
      enabledInLandingPage: true,
      click: () => {

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

  constructor(private _router: Router,private _activatedRoute:ActivatedRoute) { }

  ngOnInit() {
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.isInLandingPage = this.checkIsLandingPage();
    });
  }

  getItemDisabled(item: SideNavItem): boolean {
    return this.isInLandingPage && !item.enabledInLandingPage;
  }

  getImageUrl(item: SideNavItem): string {
    const basePath = "../../../../assets/img/applens-skeleton/side-nav";
    const folder = this.getItemDisabled(item) ? 'disable' : 'enable';
    return `${basePath}/${folder}/${item.name.toLowerCase()}.svg`;
  }

  highlightNavIcon(url: string) {
    if (url === "/") return SideNavItemName.Landing;
    if (url.endsWith("/home/category")) return SideNavItemName.Home;
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
    this._router.navigate(["/"]);
    this.dismissDialog();
  }

}

interface SideNavItem {
  name: string;
  displayName: string;
  enabledInLandingPage: boolean,
  click: () => void
}

enum SideNavItemName {
  Landing,
  Home,
  Detectors,
  Docs
}
