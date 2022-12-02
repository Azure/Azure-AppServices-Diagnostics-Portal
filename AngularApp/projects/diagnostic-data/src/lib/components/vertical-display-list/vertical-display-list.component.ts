import { Component, ContentChildren, Input, QueryList } from '@angular/core';
import { VerticalDisplayListItemComponent } from './vertical-display-list-item/vertical-display-list-item.component';
import { SolutionTypeTag } from '../../models/solution-type-tag';

@Component({
  selector: 'vertical-display-list',
  templateUrl: 'vertical-display-list.component.html',
  styleUrls: ['vertical-display-list.component.scss']
})
export class VerticalDisplayListComponent {
  @ContentChildren(VerticalDisplayListItemComponent)
  listItems: QueryList<VerticalDisplayListItemComponent>;

  titles: VerticalDisplayListMetaData[];

  @Input() showTitle: boolean = true;

  @Input() smallMenu: boolean = false;

  selectItem(item: VerticalDisplayListItemComponent) {
    this.listItems.forEach((item) => (item.metaData.isSelected = false));
    item.metaData.isSelected = true;
  }
}

export class VerticalDisplayListMetaData {
  title: string;
  isSelected: boolean;
  tags: SolutionTypeTag[];
}
