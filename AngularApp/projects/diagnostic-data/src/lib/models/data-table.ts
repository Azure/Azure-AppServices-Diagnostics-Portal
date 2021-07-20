export enum TableFilterSelectionOption {
    None = 0,
    Single,
    Multiple
}

export interface TableFilter {
    selectionOption?: TableFilterSelectionOption;
    name: string;
    defaultSelection?: string[];
}

export interface TableColumnOption extends TableFilter {
    minWidth?: number;
    maxWidth?: number;
    visible?: boolean;
}