import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';

@Component({
  selector: 'l1-side-nav',
  templateUrl: './l1-side-nav.component.html',
  styleUrls: ['./l1-side-nav.component.scss']
})
export class L1SideNavComponent implements OnInit {
  private isInLandingPage: boolean = true;
  private sideItems: SideNavItem[] = [
    { name: "Landing", displayName: "Landing", enabledInLandingPage: true },
    { name:"Home",displayName: "Home", enabledInLandingPage: false},
    { name:"Detectors",displayName: "Detectors", enabledInLandingPage: false},
    { name:"Docs",displayName: "Docs", enabledInLandingPage: true}
  ];
  panelType:PanelType = PanelType.customNear;
  panelStyles:IPanelProps['styles'] = {
    main: {
      background: "#EAEAEA",
      boxShadow: "inset -1px 0px 0px rgba(0, 0, 0, 0.12)",
      marginTop:'50px',
    }
  };

  constructor(private _router: Router) { }

  ngOnInit() {
    this.isInLandingPage = this._router.url === "/";
  }

  getItemDisabled(item:SideNavItem):boolean {
    return this.isInLandingPage && !item.enabledInLandingPage;
  }

  getImageUrl(item:SideNavItem):string {
    const basePath = "../../../../assets/img/applens-skeleton/side-nav";
    const folder = this.getItemDisabled(item)? 'disable' : 'enable';
    return `${basePath}/${folder}/${item.name.toLowerCase()}.svg`;
  }


}

interface SideNavItem {
  name: string;
  displayName: string; 
  enabledInLandingPage: boolean
}
