export enum TabKey {
    Data = "Data",
    Develop = "Develop",
    CommitHistory = "CommitHistory",
    DataSources = "DataSources",
}

export interface Tab {
    headerText: string, 
    itemKey: TabKey
}