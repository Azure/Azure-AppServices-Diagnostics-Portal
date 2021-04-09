import { FabDetailsListComponent, FabSearchBoxComponent } from '@angular-react/fabric';
import { AfterContentInit, Component, Input, TemplateRef, ViewChild } from '@angular/core';
import { DetailsListLayoutMode, IColumn, IListProps, ISelection, SelectionMode, Selection } from 'office-ui-fabric-react';
import { DataTableResponseObject, TableColumnOption, TableFilter, TableFilterSelectionOption } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';


const columnMinWidth: number = 100;
const columnMaxWidth: number = 250;

@Component({
  selector: 'fab-data-table',
  templateUrl: './fab-data-table.component.html',
  styleUrls: ['./fab-data-table.component.scss']
})
export class FabDataTableComponent implements AfterContentInit {

  constructor(private telemetryService: TelemetryService) { }

  @Input() table: DataTableResponseObject;
  @Input() columnOptions: TableColumnOption[] = [];
  @Input() descriptionColumnName: string = "";
  @Input() allowColumnSearch: boolean = false;
  @Input() tableHeight: string = "";
  @Input() description: string = "";

  selectionText = "";
  rows: any[] = [];
  rowsClone: any[] = [];
  rowLimit = 25;
  columns: IColumn[] = [];
  searchTimeout: any;
  searchAriaLabel = "Search by keywords";
  heightThreshold = window.innerHeight * 0.5;
  tableFilters: TableFilter[] = [];
  searchValue: string = "";
  tableId: number = Math.floor(Math.random() * 100);
  //All options for filters to display
  filtersMap: Map<string, Set<string>> = new Map<string, Set<string>>();
  //Options that selected by each filter
  filterSelectionMap: Map<string, Set<string>> = new Map<string, Set<string>>();
  @ViewChild(FabDetailsListComponent, { static: true }) fabDetailsList: FabDetailsListComponent;
  @ViewChild('emptyTableFooter', { static: true }) emptyTableFooter: TemplateRef<any>;
  @ViewChild(FabSearchBoxComponent, { static: false }) fabSearchBox: any;

  ngAfterContentInit() {
    if (this.columnOptions && this.columnOptions.length > 0) {
      this.columnOptions.forEach((option) => {
        if (this.validateFilterOption(option)) {
          this.tableFilters.push({ columnName: option.name, selectionOption: option.selectionOption });
          this.filtersMap.set(option.name, new Set<string>());
        }
      });
    }

    this.createFabricDataTableObjects();

    this.fabDetailsList.selectionMode = this.descriptionColumnName ? SelectionMode.single : SelectionMode.none;
    this.fabDetailsList.selection = this.selection;
    //Ideally,it should be enable if table is too large. 
    //But for now, if enabled, it will show only 40 rows
    this.fabDetailsList.onShouldVirtualize = (list: IListProps<any>) => {
      // return this.rows.length > this.rowLimit ? true : false;
      return false;
    }


    if (this.descriptionColumnName !== "") {
      this.fabDetailsList.getRowAriaLabel = (row: any) => {
        const descriptionName = this.descriptionColumnName;
        return `${descriptionName} : ${row[descriptionName]}`;
      }
    }

    let tableHeight = "";
    if (this.estimateTableHeight() >= this.heightThreshold) {
      tableHeight = `${this.heightThreshold}px`;
    }
    if (this.tableHeight !== "") {
      tableHeight = this.tableHeight;
    }
    this.fabDetailsList.styles = { root: { height: tableHeight } };

    this.fabDetailsList.layoutMode = DetailsListLayoutMode.justified;

    if (this.rowsClone.length === 0) {
      this.fabDetailsList.renderDetailsFooter = this.emptyTableFooter
    }
  }


  selection: ISelection = new Selection({
    onSelectionChanged: () => {
      const selectionCount = this.selection.getSelectedCount();
      if (selectionCount === 0) {
        this.selectionText = "";
      } else if (selectionCount === 1) {
        const row = this.selection.getSelection()[0];
        if (this.descriptionColumnName) {
          const selectionText = row[this.descriptionColumnName];
          this.selectionText = selectionText !== undefined ? selectionText : "";
        }
      }
    }
  });

  private createFabricDataTableObjects() {
    let columns = this.table.columns.map(column =>
      <IColumn>{
        key: column.columnName,
        name: column.columnName,
        ariaLabel: column.columnName,
        isSortedDescending: true,
        isSorted: false,
        isResizable: true,
        isMultiline: true,
        minWidth: this.getMinOrMaxColumnWidth(column.columnName, true),
        maxWidth: this.getMinOrMaxColumnWidth(column.columnName, false),
      });

    this.columns = columns.filter((item) => item.name !== this.descriptionColumnName && this.checkColumIsVisible(item.name));
    this.rows = [];

    this.table.rows.forEach(row => {
      const rowObject: any = {};

      for (let i: number = 0; i < this.table.columns.length; i++) {
        const columnName = this.table.columns[i].columnName
        rowObject[columnName] = row[i];

        if (this.filtersMap.has(columnName)) {
          this.filtersMap.get(columnName).add(row[i]);
        }
      }

      this.rows.push(rowObject);

      this.rowsClone = Object.assign([], this.rows);
    });
  }


  updateTable() {
    //For single search bar
    const temp = [];
    for (const row of this.rowsClone) {
      if (this.checkRowWithSearchValue(row) && this.checkRowForFilter(row)) {
        temp.push(row);
      }
    }
    this.rows = temp;
    //Update rows order with column sorting
    const column = this.columns.find(col => col.isSorted === true);
    if (column) {
      this.sortColumn(column, column.isSortedDescending);
    }
  }

  checkRowWithSearchValue(row: any): boolean {
    for (const col of this.columns) {
      const cellValue: string = row[col.name].toString();
      if (cellValue.toString().toLowerCase().indexOf(this.searchValue.toLowerCase()) !== -1) return true;
    }
    return false;
  }

  updateSearchValue(e: { event: Event, newValue?: string }) {
    this.searchValue = e.newValue;
    const val = e.newValue.toLowerCase();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.telemetryService.logEvent("TableSearch", {
        'SearchValue': val
      });
    }, 5000);
    this.updateTable();
  }

  focusSearchBox() {
    const input = this.fabSearchBox.elementRef.nativeElement.firstChild.lastElementChild;
    input.autocomplete = "off";
  }

  clickColumn(e: { ev: Event, column: IColumn }) {
    const isSortedDescending = !e.column.isSortedDescending;
    this.sortColumn(e.column, isSortedDescending);

  }

  private sortColumn(column: IColumn, isSortedDescending: boolean) {
    const columnName = column.name;

    this.rows.sort((r1, r2) => {
      return r1[columnName] > r2[columnName] ? 1 : -1;
    });

    if (isSortedDescending) {
      this.rows.reverse();
    }
    this.columns.forEach(column => {
      if (column.name === columnName) {
        column.isSortedDescending = isSortedDescending;
        column.isSorted = true;
      } else {
        column.isSorted = false;
        column.isSortedDescending = true;
      }
    });
  }

  estimateTableHeight(): number {
    return 25 * this.rowsClone.length;
  }

  getOptionsWithColName(name: string): string[] {
    const optionSet = this.filtersMap.get(name);
    return Array.from(optionSet);
  }

  updateFilter(name: string, options: Set<string>) {
    this.filterSelectionMap.set(name, options);
    //call updateTable to update table rows with latest filter
    this.telemetryService.logEvent(
      "TableFilterUpdated",
      { "FilterName": name }
    );
    this.updateTable();
  }

  private checkRowForFilter(row: any): boolean {
    //Only if filterSelectionMap has the column name and value for the cell value does not include in the set, return false
    const keys = Array.from(this.filterSelectionMap.keys());
    for (let key of keys) {
      if (row[key] !== undefined && !this.filterSelectionMap.get(key).has(row[key])) return false;
    }
    return true;
  }

  private getColumnOption(name: string): TableColumnOption {
    if (!this.columnOptions ||
      !this.columnOptions.find(option => option.name === name)) {
      return null;
    }
    const option = this.columnOptions.find(o => o.name === name);
    return option;
  }

  private checkColumIsVisible(name: string): boolean {
    const option = this.getColumnOption(name);
    return option === null ? true : option.visible;
  }

  private getMinOrMaxColumnWidth(name: string, isMinWidth: boolean = true): number {
    let width = isMinWidth ? columnMinWidth : columnMaxWidth;
    const option = this.getColumnOption(name);
    if (isMinWidth && option && option.minWidth) {
      width = option.minWidth
    } else if (!isMinWidth && option && option.maxWidth) {
      width = option.maxWidth;
    }
    return width;
  }

  private validateFilterOption(option: TableColumnOption): boolean {
    if (option.selectionOption === undefined || option.selectionOption === TableFilterSelectionOption.None) {
      return false;
    }
    const columns = this.table.columns;
    return columns.findIndex(col => col.columnName === option.name) > -1;
  }

}
