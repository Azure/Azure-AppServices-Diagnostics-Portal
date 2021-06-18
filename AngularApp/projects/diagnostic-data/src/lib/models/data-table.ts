export enum TableFilterSelectionOption {
    None = 0,
    Single,
    Multiple
}

export interface TableFilter {
    selectionOption: TableFilterSelectionOption;
    columnName: string;
    defaultSelection: string[];
}

export interface TableColumnOption {
    name: string;
    minWidth: number;
    maxWidth: number;
    selectionOption: TableFilterSelectionOption,
    visible: boolean;
}