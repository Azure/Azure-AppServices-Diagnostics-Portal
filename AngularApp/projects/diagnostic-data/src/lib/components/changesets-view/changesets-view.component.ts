import { Component, OnInit, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DataSet, Timeline} from 'vis';
import { from } from 'rxjs';
@Component({
  selector: 'changesets-view',
  templateUrl: './changesets-view.component.html',
  styleUrls: ['./changesets-view.component.scss', 
  '../insights/insights.component.scss']
})
export class ChangesetsViewComponent extends DataRenderBaseComponent {
  isPublic: boolean;
  changeSetText: string = "";
  scanDate: string = "";
  sourceGroups = new DataSet([
    {id: 1, content: 'ARG'},
    {id: 2, content: 'ARM'},
    {id: 3, content: 'AST'}
  ]);
  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService) {
    super(telemetryService);  
    this.isPublic = config && config.isPublic;
   }
   
   protected processData(data: DiagnosticData) {
    super.processData(data);
    this.parseData(data.table);
  }

  private parseData(data: DataTableResponseObject) {
    let rows = data.rows;
    if (rows.length > 0 && rows[0].length > 0) {
      this.changeSetText = `${rows.length} change groups have been detected`;
      this.constructTimeline(data);
    } else {
      this.changeSetText = `No change groups have been detected`;
    }
  }

  private constructTimeline(data: DataTableResponseObject) {
    var changeSets = data.rows;
    var timelineItems = [];
    changeSets.forEach(changeset => {
      var group = this.findGroupBySource(changeset[2]);
      timelineItems.push({
        id: changeset[0],
        content: ' ',
        start: changeset[3],
        group: group
      })
    });
       // DOM element where the Timeline will be attached
  var container = document.getElementById('timeline');

  
  var items = new DataSet(timelineItems);

   // Configuration for the Timeline
   var options = {
    height: '200px'
    };
  // Create a Timeline
  var timeline = new Timeline(container, items, this.sourceGroups, options);
  }

  private findGroupBySource(source: any): number {
    switch(source){
      case "ARG":
      return 0;
      case "ARM":
      return 1;
      case "AST":
      return 2;
      default:
      return 0;
    }
  }
}
