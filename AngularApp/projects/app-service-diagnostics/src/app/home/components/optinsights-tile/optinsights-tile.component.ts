import { Component, OnInit } from '@angular/core';
import { DataTableRendering, DataTableResponseObject, TableColumnOption } from 'diagnostic-data';
import { AggregatedInsight, DataTableResponseColumn } from '../../../shared/models/optinsights';
import { OptInsightsService } from '../../../shared/services/optinsights/optinsights.service';

@Component({
  selector: 'optinsights-tile',
  templateUrl: './optinsights-tile.component.html',
  styleUrls: ['./optinsights-tile.component.scss']
})
export class OptinsightsTileComponent implements OnInit {

  constructor(private optInsightsService: OptInsightsService) {
    // this.renderingProperties.title = "Optimization Insights (preview)";
    // this.table.columns[0].columnName = "Type";
    // this.table.columns[0].dataType = "string" ;
    // this.table.columns[0].columnType = "string";
    // this.table.columns[1].columnName = "Performance Issue";
    // this.table.columns[1].dataType = "string" ;
    // this.table.columns[1].columnType = "string";
    // this.table.columns[2].columnName = "Component";
    // this.table.columns[2].dataType = "string" ;
    // this.table.columns[2].columnType = "string";
    // this.table.rows[0] = ["Memory", "Excessive allocations due to String.Substring", "DiagService.Runners"];
  }

  //renderingProperties: DataTableRendering;
  table: any = [];
  //columnOptions: TableColumnOption[] = [];
  //columns: DataTableResponseColumn[];
  descriptionColumnName: string = "";
  allowColumnSearch: boolean = false;
  tableHeight: string = "";
  tableDescription: string = "";
  searchPlaceholder: string = "";
  loading: boolean;


  ngOnInit(): void {
    this.loading = true;
    this.optInsightsService.getInfoForOptInsights().subscribe(res => {
      if (res && res["Tables"]) {
        let rows = res["Tables"][0]["Rows"];
        this.parseRowsIntoTable(rows);
      }
      this.loading = false;
    });
  }


  parseRowsIntoTable(rows: any) {
    if (!rows || rows.length === 0) {
      return;
    }
    rows.forEach(element => {
      this.table.push({
        key: element[0],
        insight: element[1],
        metadata: element[2],
        component: element[3],
        method: element[4],
        count: element[5],
        traceOccurrences: element[6],
        maxImpactPercent: element[7],
        maxBlockingTime: element[8],
        maxTimeStamp: element[9]
      });
    });
  }
}
