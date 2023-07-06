import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { DiagnosticSiteService } from "./diagnostic-site.service";
import { ResourceDescriptor } from "../models/resource-descriptor";
import { TelemetryUtilities } from "./telemetry/telemetry.common";

@Injectable()
export class ParseResourceService {
    public supportResources: any[] = [];
    public resource: any;
    public resourceType: string;
    constructor(private _httpClient: HttpClient, private _diagnosticSiteService: DiagnosticSiteService) { }

    //Only If when parse for Primary Resource, then we can differentiate between Web App/Function App/Linux App by DiagnosticSiteService
    //Todo: add this method into telemetry.service and replace findProductName method  
    public checkIsResourceSupport(resourceUri: string, isPrimaryResource = true): Observable<string> {
        //For cache
        if (this.supportResources.length > 0) {
            const errorMsg = this.getErrorMsgForSupportType(resourceUri, isPrimaryResource);
            return of(errorMsg);
        }

        return this._httpClient.get<any>('assets/enabledResourceTypes.json').pipe(
            map(response => {
                this.supportResources = response.enabledResourceTypes;
                return this.getErrorMsgForSupportType(resourceUri, isPrimaryResource);
            })
        )
    }

    private getErrorMsgForSupportType(resourceUri: string, isPrimaryResource: boolean): string {
        if (!resourceUri.startsWith('/')) resourceUri = '/' + resourceUri;
        const descriptor = ResourceDescriptor.parseResourceUri(resourceUri);

        //Format issue,can't pass regex
        if (descriptor.provider === "" || descriptor.types.length === 0 || descriptor.resourceGroup === "" || descriptor.resource === "") {
            return "Resource Uri is not formatted properly";
        }

        const type = `${descriptor.provider}/${descriptor.types[0]}`;
        this.resource = this.supportResources.find(resource => type.toLowerCase() === resource.resourceType.toLowerCase());
        this.resourceType = this.resource ? this.resource.searchSuffix : "";

        if (this.resourceType === '') {
            return `Not Support for resource type: ${type}`;
        }

        if (isPrimaryResource) {
            this.resourceType = TelemetryUtilities.getProductNameByTypeAndKind(type, this._diagnosticSiteService.currentSite.value?.kind);
        }
        return "";
    }
}