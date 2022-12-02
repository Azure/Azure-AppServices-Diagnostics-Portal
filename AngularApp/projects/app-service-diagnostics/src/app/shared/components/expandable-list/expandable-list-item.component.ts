import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'expandable-list-item',
  templateUrl: 'expandable-list-item.component.html',
  styleUrls: ['expandable-list-item.component.scss']
})
export class ExpandableListItemComponent {
  @Input() title: string;

  @Input() titleColor: string;

  @Input() selected: boolean;

  @Output() selectedChange: EventEmitter<number> = new EventEmitter<number>();

  @Output() onSelected: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() {
    this.titleColor = '#000000';
  }

  toggleView() {
    this.selected = !this.selected;
    this.onSelected.emit(this.selected);
  }
}
