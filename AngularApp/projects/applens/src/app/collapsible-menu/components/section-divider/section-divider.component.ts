import {
  Component,
  ContentChildren,
  Input,
  OnInit,
  QueryList
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import { CollapsibleMenuItemComponent } from '../collapsible-menu-item/collapsible-menu-item.component';

@Component({
  selector: 'section-divider',
  templateUrl: './section-divider.component.html',
  styleUrls: ['./section-divider.component.scss'],
  animations: [
    trigger('expand', [
      state('shown', style({ height: '*' })),
      state('hidden', style({ height: '0px' })),
      transition('* => *', animate('.1s'))
    ])
  ]
})
export class SectionDividerComponent implements OnInit {
  @Input() label: string;
  @Input() initiallyExpanded: boolean = true;
  @Input() collapsible: boolean = true;
  @Input() disableExpandIcon: boolean = false;
  @Input() selected: boolean = false;

  expanded: boolean = true;

  constructor() {}

  ngOnInit() {
    this.expanded = this.initiallyExpanded;
  }

  toUpperCase(label: string) {
    return label.toUpperCase();
  }
}
