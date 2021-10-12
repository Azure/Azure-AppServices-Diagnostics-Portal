import { Injectable } from "@angular/core";
import { StringUtilities, UriUtilities } from "diagnostic-data";
import { PortalService } from "../../startup/services/portal.service";
import { SlotType } from "../models/slottypes";
import { ArmService } from "./arm.service";
import { Location } from "@angular/common";


@Injectable()
export class ABTestingService {
    enableABTesting: boolean = true;
    slot: SlotType;
    resourceUri: string = "";
    isPreview: boolean = false;
    constructor(private portalService: PortalService, private armService: ArmService, private location: Location) {
        if (this.armService.isNationalCloud) {
            this.enableABTesting = false;
        }

        this.portalService.getIFrameInfo().subscribe(info => {
            const slot: string = info.slot;
            this.slot = SlotType[slot];

            this.isPreview = this.slot === SlotType.Preview || this.slot === SlotType.PreviewStaging;
        });

        this.portalService.getStartupInfo().subscribe(info => {
            this.resourceUri = info.resourceId;
        })
    }

    //get deep link for switching between PROD/PREVIEW slot
    generateSlotLink(): string {
        return UriUtilities.buildSlotLink(this.resourceUri, !this.isPreview);
    }
}