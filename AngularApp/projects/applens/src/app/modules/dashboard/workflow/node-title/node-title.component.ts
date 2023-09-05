import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'node-title',
  templateUrl: './node-title.component.html',
  styleUrls: ['./node-title.component.scss']
})
export class NodeTitleComponent implements OnInit {

  collapsed: boolean = true;

  @Input() data: any;
  @Input() customClass: string = '';
  @Input() customClassIcon: string = '';
  @Input() disableEdit: boolean = false;
  @Input() hideCollapse: boolean = false;

  @Output() collapseChange = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
  }

  toggleCollapsed() {
    this.collapsed = !this.collapsed;
    this.collapseChange.emit(this.collapsed);
  }

}
