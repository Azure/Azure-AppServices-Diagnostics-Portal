import { Injectable } from "@angular/core";
import { forkJoin, Observable, pipe } from "rxjs";
import { map } from "rxjs/operators";
import { DocumentationRepoSettings } from "../../../shared/models/documentationRepoSettings";
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

@Injectable()
export class ApplensDocumentationService {
    constructor(private _diagnosticApi: DiagnosticApiService) { }

    public getDocsRepoSettings(): Observable<DocumentationRepoSettings> {
        let repoRootObservable = this._diagnosticApi.getAppSetting("SystemInvokers:DocumentationRoot");
        let stagingBranchObservable = this._diagnosticApi.getAppSetting("SystemInvokers:DocumentationStagingBranch");
        let resourceObservable = this._diagnosticApi.getAppSetting("SystemInvokers:ResourceIDString");
        let isStagingObservable = this._diagnosticApi.isStaging();

        let docsRepoRoot = '';
        let docStagingBranch = '';
        let docsResource = '';
        let isStaging = false;

        

        return forkJoin([repoRootObservable, stagingBranchObservable, resourceObservable, isStagingObservable]).pipe(map(repoSettings => {
            docsRepoRoot = repoSettings[0];
            docStagingBranch = repoSettings[1];
            docsResource = repoSettings[2];
            isStaging = repoSettings[3];

            return new DocumentationRepoSettings(docsRepoRoot, docStagingBranch, docsResource, isStaging);
        }));
    }
}