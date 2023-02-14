import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'node-title',
  templateUrl: './node-title.component.html',
  styleUrls: ['./node-title.component.scss']
})
export class NodeTitleComponent implements OnInit {

  @Input() data: any;
  @Input() customClass: string = '';
  @Input() customClassIcon: string = '';
  @Input() disableEdit: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
