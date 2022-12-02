import {
  Component,
  Input,
  AfterViewInit,
  ContentChildren,
  QueryList
} from '@angular/core';
import { ExpandableListItemComponent } from './expandable-list-item.component';

@Component({
  selector: 'expandable-list',
  templateUrl: 'expandable-list.component.html',
  styleUrls: ['expandable-list.component.scss']
})
export class ExpandableListComponent implements AfterViewInit {
  @Input() title: string;

  @ContentChildren(ExpandableListItemComponent)
  listItemComponents: QueryList<ExpandableListItemComponent>;

  constructor() {}

  ngAfterViewInit() {}
}
