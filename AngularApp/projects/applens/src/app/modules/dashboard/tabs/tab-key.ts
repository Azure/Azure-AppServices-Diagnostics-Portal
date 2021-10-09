export enum TabKey {
    Data = "Data",
    Develop = "Develop",
    CommitHistory = "CommitHistory",
}

export interface Tab {
    headerText: string, 
    itemKey: TabKey
}