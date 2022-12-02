import {
  AfterContentInit,
  Component,
  ContentChildren,
  Input,
  QueryList
} from '@angular/core';
import {
  SolutionDisplayItemComponent,
  TabMetadata
} from './solution-display-item/solution-display-item.component';

@Component({
  selector: 'solution-display',
  templateUrl: './solution-display.component.html',
  styleUrls: ['./solution-display.component.scss']
})
export class SolutionDisplayComponent implements AfterContentInit {
  @Input() showTitle = true;
  @ContentChildren(SolutionDisplayItemComponent)
  listItems: QueryList<SolutionDisplayItemComponent>;
  titles: TabMetadata[] = [];

  select(selectedTab: TabMetadata) {
    this.listItems.forEach((item) => {
      item.tabData.isSelected = item.tabData == selectedTab;
    });
  }

  ngAfterContentInit() {
    this.listItems.forEach((item) => {
      this.titles.push(item.tabData);
    });
  }
}
