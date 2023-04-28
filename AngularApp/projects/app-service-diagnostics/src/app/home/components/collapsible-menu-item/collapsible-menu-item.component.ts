import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';

@Component({
  selector: 'collapsible-menu-item',
  templateUrl: './collapsible-menu-item.component.html',
  styleUrls: ['./collapsible-menu-item.component.scss']
})

export class CollapsibleMenuItemComponent implements OnInit {
  @Input() menuItem: CollapsibleMenuItem;
  @Input() level: number = 0;
  @Input() tooltip: string = '';

  children: CollapsibleMenuItem[];
  hasChildren: boolean;
  matchesSearchTerm: boolean = true;
  imagePlaceHolder: string = '../../../../assets/img/detectors/default.svg';
  directionalHint = DirectionalHint.bottomRightEdge;

  constructor() { }

  ngOnInit() {
    this.children = this.menuItem.subItems;
    this.hasChildren = this.menuItem.subItems && this.menuItem.subItems.length > 0;
    if (this.tooltip === '') this.tooltip = this.menuItem.label;
  }

  handleClick() {
    if (this.menuItem.subItems && this.menuItem.subItems.length > 0) {
      this.menuItem.expanded = !this.menuItem.expanded;
    }
    else {
      if (document.getElementById(this.menuItem.label))
      {
        document.getElementById(this.menuItem.label).focus();
      }

      this.menuItem.onClick();
    }
  }

  isSelected() {
    if (this.menuItem.isSelected) {
      return this.menuItem.isSelected();
    }
    return false;
  }

  getPadding() {
    return (25 + this.level * 10) + 'px';
  }

  getFontSize() {
    return (14 - this.level) + 'px';
  }
}

export class CollapsibleMenuItem {
  label: string;
  onClick: Function;
  expanded: boolean = false;
  subItems: CollapsibleMenuItem[];
  isSelected: Function;
  icon: string;
  tooltip: string;

  constructor(label: string, onClick: Function, isSelected: Function, icon: string = null, tooltip: string = null, expanded: boolean = false, subItems: CollapsibleMenuItem[] = []) {
    this.label = label;
    this.onClick = onClick;
    this.expanded = expanded;
    this.subItems = subItems;
    this.isSelected = isSelected;
    this.icon = icon;
    this.tooltip = tooltip == null ? label : tooltip;
  }
}
