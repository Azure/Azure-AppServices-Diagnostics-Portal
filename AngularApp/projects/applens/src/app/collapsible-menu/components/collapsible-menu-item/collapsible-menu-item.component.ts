import { Component, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BehaviorSubject } from 'rxjs';
import { SearchPipe } from '../../pipes/search.pipe';

@Component({
  selector: 'collapsible-menu-item',
  templateUrl: './collapsible-menu-item.component.html',
  styleUrls: ['./collapsible-menu-item.component.scss'],
  animations: [
    trigger('expand', [
      state('shown', style({ height: '*' })),
      state('hidden', style({ height: '0px' })),
      transition('* => *', animate('.1s'))
    ])
  ]
})
export class CollapsibleMenuItemComponent {

  private _searchValueSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  private searchValueLocal: string;

  @Input() menuItem: CollapsibleMenuItem;
  @Input() level: number = 0;
  @Input() set searchValue(value) {
    this._searchValueSubject.next(value);
  };

  children: CollapsibleMenuItem[];

  hasChildren: boolean;
  matchesSearchTerm: boolean = true;
  get iconName() {
    return this.menuItem.expanded ? "ChevronRight" : "ChevronDown";
  }

  constructor(private _searchPipe: SearchPipe) { }

  ngOnInit() {
    this.children = this.menuItem.subItems;
    this.hasChildren = this.menuItem.subItems && this.menuItem.subItems.length > 0;

    this._searchValueSubject.subscribe(searchValue => {
      this.searchValueLocal = searchValue;
      this.menuItem.expanded = searchValue != undefined;
      this.hasChildren = this.menuItem.subItems ? this._searchPipe.transform(this.menuItem.subItems, searchValue).length > 0 : false;
      this.matchesSearchTerm = !this.searchValueLocal || this.menuItem.label.toLowerCase().indexOf(this.searchValueLocal.toLowerCase()) >= 0 || this.menuItem.id.toLowerCase().indexOf(this.searchValueLocal.toLowerCase()) >= 0 || this.menuItem.metadata && this.menuItem.metadata.toLowerCase().indexOf(this.searchValueLocal.toLowerCase()) >= 0 || this.hasChildren;
    });
  }

  handleClick() {
    if (this.menuItem.subItems && this.menuItem.subItems.length > 0) {
      this.menuItem.expanded = !this.menuItem.expanded;
    }
    else {
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
  id: string;
  metadata?: string;
  onClick: Function;
  expanded: boolean = false;
  subItems: CollapsibleMenuItem[];
  isSelected: Function;
  icon: string;

  constructor(label: string, id: string, onClick: Function, isSelected: Function, icon: string = null, expanded: boolean = false, subItems: CollapsibleMenuItem[] = [], metadata: string = null) {
    this.label = label;
    this.id = id;
    this.metadata = metadata;
    this.onClick = onClick;
    this.expanded = expanded;
    this.subItems = subItems;
    this.isSelected = isSelected;
    this.icon = icon;
  }
}
