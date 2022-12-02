import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'loader-view',
  templateUrl: './loader-view.component.html',
  styleUrls: ['./loader-view.component.scss']
})
export class LoaderViewComponent implements OnInit {
  @Input()
  message?: string;

  constructor() {}

  ngOnInit() {}
}
