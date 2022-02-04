export enum TabKey {
    Data = "Data",
    Develop = "Develop",
    CommitHistory = "CommitHistory",
    DataSources = "DataSources",
    Monitoring = "Monitoring"
}

export interface Tab {
    headerText: string, 
    itemKey: TabKey
}