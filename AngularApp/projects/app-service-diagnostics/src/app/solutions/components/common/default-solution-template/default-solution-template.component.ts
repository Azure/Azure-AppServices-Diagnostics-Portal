import { Component, Input } from '@angular/core';
import { SolutionTypeTag } from 'diagnostic-data';

@Component({
  selector: 'default-solution-template',
  templateUrl: 'default-solution-template.component.html',
  styleUrls: [
    'default-solution-template.component.scss',
    '../../../styles/solutions.scss'
  ]
})
export class DefaultSolutionTemplateComponent {
  @Input() title: string;
  @Input() description: string;
  @Input() tags: SolutionTypeTag[];
}
