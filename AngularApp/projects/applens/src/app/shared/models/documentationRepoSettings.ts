export class DocumentationRepoSettings {
    root: string = '';
    stagingBranch: string = '';
    resourceId: string = '';
    isStaging: boolean = false;

    constructor(root, stagingBranch, resourceId, isStaging) {
        this.root = root;
        this.stagingBranch = stagingBranch;
        this.resourceId = resourceId;
        this.isStaging = isStaging;
    }
}