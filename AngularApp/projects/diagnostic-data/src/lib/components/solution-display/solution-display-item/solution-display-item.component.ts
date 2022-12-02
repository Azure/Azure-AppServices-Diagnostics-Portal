import { Component, Input, OnInit } from '@angular/core';
import { SolutionTypeTag } from '../../../models/solution-type-tag';

export class TabMetadata {
  constructor(
    public title: string,
    public tag: SolutionTypeTag,
    public isSelected: boolean
  ) {}
}

@Component({
  selector: 'solution-display-item',
  templateUrl: './solution-display-item.component.html',
  styleUrls: ['./solution-display-item.component.scss']
})
export class SolutionDisplayItemComponent implements OnInit {
  @Input() title: string;
  @Input() titleTag: SolutionTypeTag;
  @Input() index: number;
  tabData: TabMetadata;

  get isSelected(): boolean {
    return this.tabData.isSelected;
  }

  ngOnInit() {
    this.tabData = new TabMetadata(this.title, this.titleTag, this.index === 0);
  }
}
