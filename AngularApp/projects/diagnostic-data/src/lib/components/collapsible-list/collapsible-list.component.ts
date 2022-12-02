import { CommonModule } from '@angular/common';
import { Component, ContentChildren, Input, QueryList } from '@angular/core';
import { CollapsibleListItemComponent } from './collapsible-list-item.component';

@Component({
  selector: 'collapsible-list',
  templateUrl: 'collapsible-list.component.html',
  styleUrls: ['collapsible-list.component.scss']
})
export class CollapsibleListComponent {
  @Input() title: string;
  @Input() collapsed: boolean;

  @ContentChildren(CollapsibleListItemComponent)
  listItemComponents: QueryList<CollapsibleListItemComponent>;

  constructor() {}
}
