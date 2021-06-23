import { FabPanelComponent } from '@angular-react/fabric';
import { Component, OnInit, ViewChild } from '@angular/core';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../applens-global';
import { l1SideNavCollapseWidth, l1SideNavExpandWidth } from '../../../shared/components/l1-side-nav/l1-side-nav';
import { L2SideNavType } from './l2-side-nav';

@Component({
  selector: 'l2-side-nav',
  templateUrl: './l2-side-nav.component.html',
  styleUrls: ['./l2-side-nav.component.scss']
})
export class L2SideNavComponent implements OnInit {
  panelType: PanelType = PanelType.customNear;
  type: L2SideNavType = L2SideNavType.None;
  get isSideNavOpen():boolean {
    return this.type !== L2SideNavType.None;
  }
  openL2SideNav: boolean = false;
  panelMarginTop: number = 130;
  panelStyles: IPanelProps['styles'] = {
    root: {
      marginLeft: l1SideNavCollapseWidth,
    },
    main: {
      boxShadow: "none"
    }
  }

  panelFocusTrapZoneProps: IPanelProps["focusTrapZoneProps"] = {
    disabled: true
  }

  @ViewChild(FabPanelComponent, {static: false}) fabPanelComponent: FabPanelComponent;
  constructor(private _applensGlobal: ApplensGlobal) { }

  ngOnInit() {
    this._applensGlobal.openL2SideNavSubject.subscribe(type => {
      this.type = type;
    });
    this._applensGlobal.showCommAlertSubject.subscribe(showCommAlert => {
      this.panelMarginTop = showCommAlert ? 200 : 130;
      this.panelStyles["root"].marginTop = `${this.panelMarginTop}px`;
    });
    this._applensGlobal.expandL1SideNavSubject.subscribe(isExpand => {
      const styles = {...this.panelStyles};
      styles["root"].marginLeft = isExpand ? l1SideNavExpandWidth : l1SideNavCollapseWidth;
      if(this.fabPanelComponent && this.fabPanelComponent.styles){
        this.fabPanelComponent.styles = styles;
      }
    });
  }

  dismissSideNav() {
    this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.None);
  }

  getdatePanelStyle() {

  }

}
