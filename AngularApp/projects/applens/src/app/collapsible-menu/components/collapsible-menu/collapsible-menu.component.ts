import { Component, OnInit, Input } from '@angular/core';
import { ApplensGlobal } from '../../../applens-global';

@Component({
  selector: 'collapsible-menu',
  templateUrl: './collapsible-menu.component.html',
  styleUrls: ['./collapsible-menu.component.scss']
})
export class CollapsibleMenuComponent implements OnInit {

  @Input() theme: string = 'dark';
  @Input() height: string = '100%';

  menuClass: any = ['menu'];
  iconClass: any = ['fa fa-chevron-left'];
  sideMenuCollapsed: boolean = false;

  constructor(private globals: ApplensGlobal) { }

  ngOnInit() {
  }

  collapseSideMenu(): void {

    this.sideMenuCollapsed = !this.sideMenuCollapsed;
    this.menuClass = this.sideMenuCollapsed == true ? ['menu', 'menu-hidden'] : ['menu'];
    this.iconClass = this.sideMenuCollapsed == true ?  ['fa fa-chevron-right'] : ['fa fa-chevron-left'];
    this.globals.sideMenuCollapsed.next(this.sideMenuCollapsed);

  }
}