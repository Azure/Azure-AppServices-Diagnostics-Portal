import { Component, ViewChild, AfterViewInit, AfterContentInit } from '@angular/core';
import { DiagnosticData, DataTableRendering } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import { SelectionMode, IColumn, IListProps, ISelection, Selection, IDetailsListProps, DetailsListLayoutMode, ITextFieldProps, IStyle } from 'office-ui-fabric-react';
import { FabDetailsListComponent } from '@angular-react/fabric';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

HC_exporting(Highcharts);

@Component({
  selector: 'data-table-v4',
  templateUrl: './data-table-v4.component.html',
  styleUrls: ['./data-table-v4.component.scss']
})
export class DataTableV4Component extends DataRenderBaseComponent implements AfterContentInit {
  Highcharts: typeof Highcharts = Highcharts;
  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  ngAfterContentInit() {
    this.createFabricDataTableObjects();

    this.fabDetailsList.selectionMode = this.renderingProperties.descriptionColumnName ? SelectionMode.single : SelectionMode.none;
    this.fabDetailsList.selection = this.selection;
    //Ideally,it should be enable if table is too large. 
    //But for now, if enabled, it will show only 40 rows
    this.fabDetailsList.onShouldVirtualize = (list: IListProps<any>) => {
      // return this.rows.length > this.rowLimit ? true : false;
      return false;
    }
    if (this.renderingProperties.allowColumnSearch) {
      this.allowColumnSearch = this.renderingProperties.allowColumnSearch;
    }
    this.fabDetailsList.layoutMode = DetailsListLayoutMode.justified;


    //Customize table style
    const detailListStyles: IStyle = { height: '300px', overflowX: "hidden" };
    if (this.renderingProperties.height != null && this.renderingProperties.height !== "") {
      detailListStyles.height = this.renderingProperties.height;
    }
    this.fabDetailsList.styles = { root: detailListStyles };
  }

  // DataRenderingType = RenderingType.Table;
  selection: ISelection = new Selection({
    onSelectionChanged: () => {
      const selectionCount = this.selection.getSelectedCount();
      if (selectionCount === 0) {
        this.selectionText = "";
      } else if (selectionCount === 1) {
        const row = this.selection.getSelection()[0];
        if (this.renderingProperties.descriptionColumnName) {
          this.selectionText = row[this.renderingProperties.descriptionColumnName];
        }
      }
    }
  });
  selectionText = "";
  rows: any[];
  rowsClone: any[];
  rowLimit = 25;
  renderingProperties: DataTableRendering;
  searchText = {};
  tableColumns: IColumn[] = [];
  allowColumnSearch: boolean = false;
  searchTimeout: any;
  searchAriaLabel = "Filter by all columns";
  @ViewChild(FabDetailsListComponent, { static: true }) fabDetailsList: FabDetailsListComponent;
  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DataTableRendering>data.renderingProperties;
  }

  private createFabricDataTableObjects() {
    let columns = this.diagnosticData.table.columns.map(column =>
      <IColumn>{
        key: column.columnName,
        name: column.columnName,
        ariaLabel: column.columnName,
        isSortedDescending: true,
        isSorted: false,
        isResizable: true,
        isMultiline: true,
      });

    this.tableColumns = columns.filter((item) => item.name !== this.renderingProperties.descriptionColumnName);
    this.rows = [];

    this.diagnosticData.table.rows.forEach(row => {
      const rowObject: any = {};

      for (let i: number = 0; i < this.diagnosticData.table.columns.length; i++) {
        rowObject[this.diagnosticData.table.columns[i].columnName] = row[i];
      }

      this.rows.push(rowObject);

      if (this.renderingProperties.descriptionColumnName && this.rows.length > 0) {
        this.selectionText = ""
      }

      this.rowsClone = Object.assign([], this.rows);
    });
  }


  //For now use one search bar for all columns 
  updateFilter(e: { event: Event, newValue?: string }) {
    // const val = event.target.value.toLowerCase();
    const val = e.newValue.toLowerCase();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.telemetryService.logEvent("TableSearch", {
        'SearchValue': val
      });
    }, 5000);
    // this.searchTexts[column.name] = val;
    // const temp = this.rowsClone.filter(item => {
    //   let allMatch = true;
    //   Object.keys(this.searchTexts).forEach(key => {
    //     if (item[key]) {
    //       allMatch = allMatch && item[key].toString().toLowerCase().indexOf(this.searchTexts[key]) !== -1;
    //     }
    //   });
    //   return allMatch;
    // });

    //For single search bar
    const temp = [];
    for (const row of this.rowsClone) {
      for (const col of this.tableColumns) {
        const cellValue: string = row[col.name].toString();
        if (cellValue.toString().toLowerCase().indexOf(val) !== -1) {
          temp.push(row);
        }
      }
    }
    this.rows = temp;
  }

  clickColumn(e: { ev: Event, column: IColumn }) {
    this.sortColumn(e.column);
  }

  private sortColumn(column: IColumn) {
    const isSortedDescending = column.isSortedDescending;
    const columnName = column.name;

    this.rows.sort((r1, r2) => {
      return r1[columnName] > r2[columnName] ? 1 : -1;
    });

    if (column.isSortedDescending) {
      this.rows.reverse();
    }
    const col = this.tableColumns.find(c => c.name === columnName);
    col.isSortedDescending = !isSortedDescending;
    col.isSorted = true;
  }
}


