import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';

@Component({
  selector: 'create-workflow',
  templateUrl: './create-workflow.component.html',
  styleUrls: ['./create-workflow.component.scss']
})
export class CreateWorkflowComponent implements OnInit, AfterViewInit {
  disabled: boolean = true;
  options: NgFlowchart.Options = {
    stepGap: 40,
    rootPosition: 'TOP_CENTER',
    zoom: {
      mode: 'DISABLED'
    }
  }

  @ViewChild('normalStep')
  normalStepTemplate: TemplateRef<any>;

  @ViewChild(NgFlowchartCanvasDirective)
  canvas: NgFlowchartCanvasDirective;

  constructor(private stepRegistry: NgFlowchartStepRegistry) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.stepRegistry.registerStep('node', this.normalStepTemplate);
    this.uploadData();
  }

  uploadData() {
    let jsonString = '{"root":{"id":"s1608918280530","type":"node","data":{"name":"Workflows"},"children":[{"id":"s1608918283650","type":"node","data":{"name":"Coming soon!"},"children":[]}]}}';
    this.canvas.getFlow().upload(jsonString);
  }

  showFlowData() {
    let json = this.canvas.getFlow().toJSON(4);

    var x = window.open();
    x.document.open();
    x.document.write(
      '<html><head><title>Flowchart Json</title></head><body><pre>' +
      json +
      '</pre></body></html>'
    );
    x.document.close();
  }
}