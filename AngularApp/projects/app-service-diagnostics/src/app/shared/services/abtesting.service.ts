import { Injectable } from "@angular/core";
import { DemoSubscriptions, ResourceDescriptor, UriUtilities } from "diagnostic-data";
import { PortalService } from "../../startup/services/portal.service";
import { SlotType } from "../models/slottypes";
import { ArmService } from "./arm.service";
import { ResourceService } from "../../shared-v2/services/resource.service";
import { BackendCtrlService } from "./backend-ctrl.service";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";


@Injectable()
export class ABTestingService {
    enableABTesting: ABTestingType = ABTestingType.BySubscription;
    slot: SlotType;
    resourceUri: string = "";
    //For Sub AB testing only
    private readonly percentageToPreview: number = 0;

    constructor(private portalService: PortalService, private armService: ArmService, private resourceService: ResourceService, private backendCtrlService: BackendCtrlService) {
    }

    private checkIfSubAllowedForPreview(): boolean {
        const subscriptionId = ResourceDescriptor.parseResourceUri(this.resourceService.resourceIdForRouting).subscription.toLocaleLowerCase();

        const isInDemoSubs = DemoSubscriptions.betaSubscriptions.indexOf(subscriptionId.toLowerCase()) > -1
        if (isInDemoSubs) {
            return true;
        }
        const firstDigit = '0x' + subscriptionId.substring(0, 1);

        return (16 - parseInt(firstDigit, 16)) / 16 <= this.percentageToPreview;
    }

    //Only Web App and AKS allowed
    private checkIfResourceAllowedForPreview(): boolean {
        const resourceUri = this.resourceService.resourceIdForRouting
        const provider = ResourceDescriptor.parseResourceUri(resourceUri).provider.toLocaleLowerCase();

        return provider === 'microsoft.web' || provider === 'microsoft.containerservice';
    }

    public checkIfEnabledByAppSetting(): Observable<boolean> {
        return this.backendCtrlService.get<boolean>(`api/appsettings/ConversationalDiagnostic:Enabled`).pipe(map(res => `${res}`.toLowerCase() === "true"), catchError((err) => of(false)));
    }

    public isPreview(): Observable<boolean> {
        if (this.armService.isNationalCloud) {
            this.enableABTesting = ABTestingType.Disabled;
            return of(false);
        } else if (this.enableABTesting === ABTestingType.BySlot) {
            this.portalService.getIFrameInfo().pipe(map(info => {
                const slot: string = info.slot;
                if (slot != undefined) this.slot = SlotType[slot];
                this.resourceUri = info.resourceId;
                return of(this.slot === SlotType.Preview || this.slot === SlotType.PreviewStaging);
            }));
        } else if (this.enableABTesting === ABTestingType.BySubscription) {
            return this.checkIfEnabledByAppSetting().pipe(map((enabled) => {
                return enabled && this.checkIfResourceAllowedForPreview() && this.checkIfSubAllowedForPreview();
            }), catchError((err) => of(false)));
        }
    }

    //get deep link for switching between PROD/PREVIEW slot
    generateSlotLink(): string {
        return UriUtilities.buildSlotLink(this.resourceUri, !this.isPreview);
    }
}

export enum ABTestingType {
    Disabled,
    BySlot,
    BySubscription
}