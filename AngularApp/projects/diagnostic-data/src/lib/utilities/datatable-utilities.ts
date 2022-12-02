import { DataTableResponseObject } from '../models/detector';

export class DataTableUtilities {
  public static getColumnIndexByName(
    table: DataTableResponseObject,
    columnName: string,
    ignoreCase: boolean = false
  ): number {
    if (ignoreCase) {
      return table.columns.findIndex(
        (column) => column.columnName.toLowerCase() === columnName.toLowerCase()
      );
    } else {
      return table.columns.findIndex(
        (column) => column.columnName === columnName
      );
    }
  }
}
