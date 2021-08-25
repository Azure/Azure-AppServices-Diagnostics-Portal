import { Injectable } from "@angular/core";
import { StringUtilities, UriUtilities } from "diagnostic-data";
import { PortalService } from "../../startup/services/portal.service";
import { SlotType } from "../models/slottypes";
import { ArmService } from "./arm.service";
import { Location } from "@angular/common";


@Injectable()
export class ABTestingService {
    enableABTesting: boolean = true;
    slotType: SlotType;
    resourceUri: string = "";
    constructor(private portalService: PortalService, private armService: ArmService, private location: Location) {
        if (this.armService.isNationalCloud) {
            this.enableABTesting = false;
        }

        this.portalService.getIFrameInfo().subscribe(info => {
            const slot: string = info.slot;
            this.slotType = SlotType[slot];
        });

        this.portalService.getStartupInfo().subscribe(info => {
            this.resourceUri = info.resourceId;
        })
    }

    //get deep link for switching between PROD/PREVIEW slot
    generateSlotLink(): string {
        switch (this.slotType) {
            case SlotType.Prod:
                return UriUtilities.buildSlotLink(this.resourceUri, true);
            case SlotType.Preview:
                return UriUtilities.buildSlotLink(this.resourceUri, false);
            default:
                return UriUtilities.buildSlotLink(this.resourceUri, false);
        }
    }

    navigate() {
        try {
            const path = `https://portal.azure.com/`;
            const isPreview = this.slotType === SlotType.Preview || this.slotType === SlotType.PreviewStaging;
            const query = `websitesextension_ext=asd.ispreview%3D${isPreview}#@microsoft.onmicrosoft.com/resource/${StringUtilities.TrimBoth(this.resourceUri, '/')}/troubleshoot`;

            //top.window or window.parent.window
            // top.window.location.assign(this.generateSlotLink());
            // top.window.location.reload();
            // top.window.location.href = this.generateSlotLink();
            // window.top.location.assign(this.generateSlotLink());
            // window.parent.location.href = this.generateSlotLink();
            this.portalService.postMessage("","");
        } catch(e) {
            console.error(e);
        }
    }

}