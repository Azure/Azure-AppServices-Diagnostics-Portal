import { Injectable } from '@angular/core';
import { TelemetryService } from './telemetry/telemetry.service';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class GenericLinkInterceptorService {

  interceptLinkClick(e: Event, router: Router, detector: string, telemetryService: TelemetryService, activatedRoute: ActivatedRoute) {
  }
}
