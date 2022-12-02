import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { SeverityLevel } from '../models/telemetry';
import { TelemetryService } from './telemetry/telemetry.service';

@Injectable({
  providedIn: 'root'
})
export class UnhandledExceptionHandlerService extends ErrorHandler {
  router: Router;

  constructor(private injector: Injector) {
    super();
  }

  handleError(error: Error) {
    try {
      if (this.router == undefined) {
        this.router = this.injector.get(Router);
      }

      const logService = this.injector.get(TelemetryService);

      const props = {
        route: this.router.url
      };

      if (error.stack != undefined) {
        props['stack'] = error.stack;
      }

      logService.logException(
        error,
        'unhandled',
        props,
        SeverityLevel.Critical
      );
    } catch (err) {
      // Squash logging error
    }
  }
}
