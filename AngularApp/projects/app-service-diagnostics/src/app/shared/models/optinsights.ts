import { IColumn } from "office-ui-fabric-react";

export interface AggregatedInsight {
    key: string;
    insight: Insight; 
    metadata: any;
    component: string;
    method: string;
    count: number;
    traceOccurrences: number; 
    maxImpactPercent: number; 
    maxBlockingTime: number; 
    maxTimeStamp: string; 
}

export interface Insight {
    appId: string;
    roleName: string;
    timeStamp: string;
    type: any;
    impactPercent: number;
    thresholdPercent: number;
    blockingTime: number;
    issue: any;
    details: any;
    context: Array<string>;
    symbol: string;
    parentSymbol: string;
    component: string;
    method: string;
}

export interface OptInsightsResponse {
    // tableName: string;
    columns: IColumn[] = [
        {
          key: 'column1',
          name: 'Type',
          className: "Type Class",
          iconClassName: "fileIconHeaderIcon",
          ariaLabel: 'Column operations for File type, Press to sort on File type',
          iconName: 'Page',
          isIconOnly: true,
          fieldName: 'name',
          minWidth: 16,
          maxWidth: 16,
          onColumnClick: this._onColumnClick
        },
        {
          key: 'column2',
          name: 'Performance Issue',
          fieldName: 'name',
          minWidth: 210,
          maxWidth: 350,
          isRowHeader: true,
          isResizable: true,
          isSorted: true,
          isSortedDescending: false,
          sortAscendingAriaLabel: 'Sorted A to Z',
          sortDescendingAriaLabel: 'Sorted Z to A',
          onColumnClick: this._onColumnClick,
          data: 'string',
          isPadded: true,
        },
        {
          key: 'column3',
          name: 'Component',
          fieldName: 'dateModifiedValue',
          minWidth: 70,
          maxWidth: 90,
          isResizable: true,
          onColumnClick: this._onColumnClick,
          data: 'number',
          onRender: (item: IDocument) => {
            return <span>{item.dateModified}</span>;
          },
          isPadded: true,
        }
    ];
    rows: any[][];
}

export interface DataTableResponseColumn {
    columnName: string;
    dataType?: string;
    columnType?: string;
}