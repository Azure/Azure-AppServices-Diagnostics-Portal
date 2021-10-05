import { Component, Input } from '@angular/core';

@Component({
  selector: 'fab-card',
  templateUrl: "./fab-card.component.html",
  styleUrls: ["./fab-card.component.scss"]
})
export class FabCardComponent {
  //Will push content to right a little, this is for cards without chevron to be aligned with those has chevron
  @Input() isAlign: boolean = false;
  @Input() isExpandable: boolean = true;
  @Input() expanded: boolean = true;
  @Input() ariaLabel: string = "";
  @Input() background: string = "";
  get ariaExpaned() {
    if(!this.isExpandable) return null;
    return this.expanded ? "true" : "false";
  }
  toggleExpand() {
    this.expanded = !this.expanded;
  }
}



