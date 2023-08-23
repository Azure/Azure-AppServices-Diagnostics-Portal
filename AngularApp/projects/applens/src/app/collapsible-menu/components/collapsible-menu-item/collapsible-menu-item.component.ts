import { Component, Input } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BehaviorSubject } from 'rxjs';
import { DirectionalHint } from 'office-ui-fabric-react';
import { SuffixArray } from 'diagnostic-data';

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

  //private _searchValueSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  private searchValueLocal: string;

  @Input() menuItem: CollapsibleMenuItem;
  @Input() level: number = 0;
  @Input() boldText: boolean = false;
  @Input() set searchValue(value) {
    //this._searchValueSubject.next(value);
  };
  //if alwaysShowItem is true, item will show even searchTerm is not matched
  @Input() alwaysShowItem: boolean = false;

  children: CollapsibleMenuItem[];

  hasChildren: boolean;
  matchesSearchTerm: boolean = true;
  get iconName() {
    return this.menuItem.expanded ? "ChevronRight" : "ChevronDown";
  }

  directionalHint = DirectionalHint.bottomLeftEdge;

  constructor() { }

  ngOnInit() {
    this.children = this.menuItem.subItems;
    this.hasChildren = this.menuItem.subItems && this.menuItem.subItems.length > 0;

    // this._searchValueSubject.subscribe(searchValue => {
    //     this.searchValueLocal = searchValue;
    // });
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
    return (10 + this.level * 10) + 'px';
  }

  getFontSize() {
    return (13 - this.level) + 'px';
  }

  isLabelWordBreakable(label: string): boolean {
    return label.includes(" ");
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
  group?:string
  visible?:boolean = true;
  idSuffixArray?: Array<string>;
  labelSuffixArray?: Array<string>;

  constructor(label: string, id: string, onClick: Function, isSelected: Function, icon: string = null, expanded: boolean = false, subItems: CollapsibleMenuItem[] = [], metadata: string = null) {
    this.label = label;
    this.id = id;
    this.metadata = metadata;
    this.onClick = onClick;
    this.expanded = expanded;
    this.subItems = subItems;
    this.isSelected = isSelected;
    this.icon = icon;
    this.visible = true;
    this.idSuffixArray = SuffixArray.buildSuffixArray(id);
    this.labelSuffixArray = SuffixArray.buildSuffixArray(label);
  }
}
