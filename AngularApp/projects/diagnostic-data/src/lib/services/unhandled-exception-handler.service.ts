import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { SeverityLevel } from '../models/telemetry';
import { KustoTelemetryService } from './telemetry/kusto-telemetry.service';

@Injectable({
  providedIn: 'root'
})
export class UnhandledExceptionHandlerService {

    router: Router;

    constructor(private logService: KustoTelemetryService, private injector: Injector) {
        this.router = injector.get(Router);
    }

    handleError(error: Error) {
        try {
            const props = {
                'route': this.router.url
            }

            this.logService.logException(error, "unhandled", props, null, SeverityLevel.Critical);
        }
        catch (err) {
            // Squash logging error
        }
    }
}
