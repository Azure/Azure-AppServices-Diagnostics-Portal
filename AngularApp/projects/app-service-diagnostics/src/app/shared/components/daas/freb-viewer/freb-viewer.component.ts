import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'freb-viewer',
  templateUrl: './freb-viewer.component.html',
  styleUrls: ['./freb-viewer.component.scss', './../daas/daas.component.scss']
})
export class FrebViewerComponent implements OnInit {
  constructor() {}

  title: string = 'Failed Request Tracing Logs';
  description: string =
    'Drill down to view Failed Request tracing logs for your App';

  ngOnInit() {}
}
