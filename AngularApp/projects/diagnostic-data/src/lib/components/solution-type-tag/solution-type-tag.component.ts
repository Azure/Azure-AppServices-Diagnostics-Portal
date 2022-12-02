import { Component, Input } from '@angular/core';
import { SolutionTypeTag } from '../../models/solution-type-tag';

@Component({
  selector: 'solution-type-tag',
  templateUrl: 'solution-type-tag.component.html',
  styleUrls: ['solution-type-tag.component.scss']
})
export class SolutionTypeTagComponent {
  @Input() tagType: SolutionTypeTag;
  @Input() textSize: string = '11px';

  localTagType = SolutionTypeTag;
}
