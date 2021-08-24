export class UserSetting {
    public resources: RecentResource[];
    public id:string;

    constructor(id:string,resources: RecentResource[] = []) {
        this.id = id;
        this.resources = resources;
    }


}

export interface RecentResource {
    kind: string;
    resourceUri: string;
    //Todo: starttime and endtime
}