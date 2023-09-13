import { Injectable } from "@angular/core";
import { ConversationalDiagService, TelemetryService } from "diagnostic-data";
import { environment } from "../../../environments/environment";

@Injectable()
export class ConversationalDiagPortalService extends ConversationalDiagService {
    protected signalRChatEndpoint: string;
    constructor(protected telemetryService: TelemetryService) {
        super(telemetryService);
        this.signalRChatEndpoint = `${environment.conversationalDiagnosticsHost}chatHub`;
    }
}