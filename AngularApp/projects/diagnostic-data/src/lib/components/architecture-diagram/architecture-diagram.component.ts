import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFlowchart, NgFlowchartCanvasDirective, NgFlowchartStepComponent, NgFlowchartStepRegistry } from 'projects/ng-flowchart/dist';
import { DataTableResponseObject, DiagnosticData, Rendering } from '../../models/detector';
import { DiagnosticService } from '../../services/diagnostic.service';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { ArchitectureDiagramNodeComponent } from '../architecture-diagram-node/architecture-diagram-node.component';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'architecture-diagram',
  templateUrl: './architecture-diagram.component.html',
  styleUrls: ['./architecture-diagram.component.scss']
})
export class ArchitectureDiagramComponent extends DataRenderBaseComponent implements OnInit{

@ViewChild(NgFlowchartCanvasDirective)
canvas: NgFlowchartCanvasDirective;

  architecture : string = ""; 
  architectureObj : any; 
  jsonArchitectureArr : any = []; 
  disabled = false;
  jsonArchitecture: any; 

  options: NgFlowchart.Options = {
    stepGap: 40,
    isSequential: false,
    rootPosition: 'TOP_CENTER',
    zoom: {
      mode: 'DISABLED'
    }

  };

  constructor(private _diagnosticService: DiagnosticService,  private stepRegistry: NgFlowchartStepRegistry, private _router: Router,
    private _activatedRoute: ActivatedRoute, protected telemetryService: TelemetryService, private _navigator: FeatureNavigationService) { 
      super(telemetryService);
  }
    
  ngAfterViewInit() {

    //created from custom step component
    this.stepRegistry.registerStep('default', ArchitectureDiagramNodeComponent);
    super.ngOnInit(); 
  }

  
  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.parseData(data.table);
  }

   // parses the incoming data to render a form
   private parseData(data: DataTableResponseObject) {

    if(this.canvas == undefined){
      return; 
    }
    
    let numRows = data.rows.length; 
     
    //numRows should always be one 
    //the first element should always thus contain the json string 
    //for code extensability, implement for loop and null check  
    //only one column 

    for(let i = 0; i < numRows; i++){
      if(data.rows[i]){
        let tempString = data.rows[i][0]; 
        this.architecture = tempString; 
      }
    }
    let flow = this.canvas.getFlow();
    flow.upload(this.architecture);
  }

  showRender(){
    this.canvas.getFlow().render(); 
  }

}
