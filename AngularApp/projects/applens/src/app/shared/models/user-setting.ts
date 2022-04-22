export class UserSetting {
    public resources: RecentResource[];
    public id:string;
    public theme: string;
    public viewMode: string;
    public expandAnalysisCheckCard: boolean;
    public defaultServiceType: string;

    constructor(id:string,resources: RecentResource[] = [], theme:string="light", viewMode: string="smarter", expandAnalysisCheckCard: boolean = false,defaultServiceType = "") {
        this.id = id;
        this.resources = resources;
        this.theme = theme;
        this.viewMode = viewMode;
        this.expandAnalysisCheckCard = expandAnalysisCheckCard;
        this.defaultServiceType = defaultServiceType;
    }


}

export interface RecentResource {
    kind: string;
    resourceUri: string;
    //Todo: starttime and endtime
}
