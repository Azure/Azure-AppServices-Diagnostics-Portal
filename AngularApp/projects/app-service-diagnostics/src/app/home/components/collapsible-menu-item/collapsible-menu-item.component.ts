import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BehaviorSubject } from 'rxjs';
import { SearchPipe } from '../pipes/search.pipe';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';

@Component({
  selector: 'collapsible-menu-item',
  templateUrl: './collapsible-menu-item.component.html',
  styleUrls: ['./collapsible-menu-item.component.scss']
})

export class CollapsibleMenuItemComponent implements OnInit {
    private _searchValueSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
    private searchValueLocal: string;

  @Input() menuItem: CollapsibleMenuItem;
  @Input() level: number = 0;

  children: CollapsibleMenuItem[];
  hasChildren: boolean;
  matchesSearchTerm: boolean = true;
  imagePlaceHolder: string = '../../../../assets/img/detectors/default.svg';
  directionalHint = DirectionalHint.bottomRightEdge;

  constructor(private telemetryService:TelemetryService) { }

  ngOnInit() {
    this.children = this.menuItem.subItems;
    this.hasChildren = this.menuItem.subItems && this.menuItem.subItems.length > 0;
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

      this.telemetryService.logEvent(TelemetryEventNames.CategoryNavItemClicked,{
        'DetectorName':this.menuItem.label
      });
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

  constructor(label: string, onClick: Function, isSelected: Function, icon: string = null, expanded: boolean = false, subItems: CollapsibleMenuItem[] = []) {
    this.label = label;
    this.onClick = onClick;
    this.expanded = expanded;
    this.subItems = subItems;
    this.isSelected = isSelected;
    this.icon = icon;
  }
}
