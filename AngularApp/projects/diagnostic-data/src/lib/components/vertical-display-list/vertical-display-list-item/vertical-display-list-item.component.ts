import { Component, Input } from '@angular/core';
import { VerticalDisplayListMetaData } from '../vertical-display-list.component';
import { SolutionTypeTag } from '../../../models/solution-type-tag';

@Component({
  selector: 'vertical-display-list-item',
  templateUrl: 'vertical-display-list-item.component.html',
  styleUrls: ['../vertical-display-list.component.scss']
})
export class VerticalDisplayListItemComponent {
  @Input() name: string;
  @Input() tags: SolutionTypeTag[];
  @Input() index: number;

  public metaData: VerticalDisplayListMetaData;

  ngOnInit() {
    this.metaData = <VerticalDisplayListMetaData>{
      title: this.name,
      tags: this.tags,
      isSelected: this.index === 0
    };
  }
}
