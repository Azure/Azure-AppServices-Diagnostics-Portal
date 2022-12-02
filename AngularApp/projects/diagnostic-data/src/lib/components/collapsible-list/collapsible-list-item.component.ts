import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'collapsible-list-item',
  templateUrl: 'collapsible-list-item.component.html',
  styleUrls: ['collapsible-list.component.scss']
})
export class CollapsibleListItemComponent {
  @Input() disabled: boolean = false;
  @Output() onSelect: EventEmitter<any> = new EventEmitter<any>();

  @Input() marginTop: number = 0;

  constructor() {}

  raiseSelectEvent(): void {
    if (!this.disabled) {
      this.onSelect.emit();
    }
  }
}
