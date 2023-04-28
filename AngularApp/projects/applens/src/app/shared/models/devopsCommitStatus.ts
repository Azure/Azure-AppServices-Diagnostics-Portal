export class CommitStatus {
    id: number;
    state: DevOpsState;
    context: Context;
    targetUrl: string = "";
    description:string = "";
    commitId: string = "";
    creationDate:string = "";
}
export class Context {
    name: string = "";
    genre: string ="";
}
export enum DevOpsState {
    NotSet,
    Pending,
    Succeeded,
    Failed,
    Error,
    NotApplicable
}