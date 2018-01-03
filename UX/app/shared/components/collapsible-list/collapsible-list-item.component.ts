import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'collapsible-list-item',
    templateUrl: 'collapsible-list-item.component.html',
    styleUrls: ['collapsible-list.component.css']
})
export class CollapsibleListItemComponent {

    @Input() disabled: boolean = false;
    @Output() onSelect: EventEmitter<any> = new EventEmitter<any>();

    constructor() {
    }

    raiseSelectEvent(): void {
        if (!this.disabled) {
            this.onSelect.emit();
        }
    }

}