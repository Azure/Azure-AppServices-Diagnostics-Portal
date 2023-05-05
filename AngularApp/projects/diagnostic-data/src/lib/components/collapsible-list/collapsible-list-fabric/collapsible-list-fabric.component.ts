import { Component, OnInit, Input, ContentChildren, QueryList, EventEmitter, Output } from '@angular/core';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { CollapsibleListItemComponent } from '../collapsible-list-item.component';

@Component({
  selector: 'collapsible-list-fabric',
  templateUrl: './collapsible-list-fabric.component.html',
  styleUrls: ['./collapsible-list-fabric.component.scss']
})
export class CollapsibleListFabricComponent {

  @Input() title: string;
  @Input() collapsed: boolean;
  @Input() lessMargin: boolean = false;
  @Input() iconProps: any = null;

  @Output() collapsedChange = new EventEmitter<any>();

  @ContentChildren(CollapsibleListItemComponent) listItemComponents: QueryList<CollapsibleListItemComponent>;
  ariaLabelChevronUp: string;

  constructor(private telemetryService:TelemetryService) {
  }

  ngOnInit(): void {
    this.ariaLabelChevronUp = `${this.title} chevron up ${this.collapsed ? 'collapsed' : 'expanded'}`;
  }
  clickHandler() {
    this.telemetryService.logEvent("ClickCollapsibleList",{
      "CurrentState" : this.collapsed ? "Collapse" : "Expand",
      "Title": this.title
    });
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }
}
