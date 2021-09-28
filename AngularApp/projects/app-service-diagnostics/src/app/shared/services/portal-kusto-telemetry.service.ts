import { PortalService } from './../../startup/services/portal.service';
import { Injectable } from '@angular/core';
import { ITelemetryProvider } from 'diagnostic-data';
import { SlotType } from '../models/slottypes';

@Injectable({
  providedIn: 'root'
})
export class PortalKustoTelemetryService implements ITelemetryProvider {
  constructor(private _portalService: PortalService) {}

  logEvent(eventMessage: string, properties: { [name: string]: string }, measurements?: any) {
    this._portalService.logAction('diagnostic-data', eventMessage, {
      ...properties,
      'measurements': measurements
    });
  }

  logException(exception: Error, handledAt?: string, properties?: { [name: string]: string }, measurements?: any, severityLevel?: any) {
    this._portalService.logAction('diagnostic-data-exception', exception.message, {
      ...properties,
      'handledAt': handledAt,
      'measurements': measurements,
      'severityLevel': severityLevel
    });
  }

  logPageView(name: string, url: string, properties?: { [name: string]: string }, measurements?: any, duration?: number) {
    this._portalService.logAction('diagnostic-data-pageview', name, {
      ...properties,
      'url': url,
      'measurements': measurements,
      'duration': duration
    });
  }

  logTrace(message: string, customProperties?: { [name: string]: string }, customMetrics?: any) {
    this._portalService.logAction('diagnostic-data-trace', message, {
      ...customProperties,
      'customMetrics': customMetrics
    });
  }

  logMetric(name: string, average: number, sampleCount: number, min: number, max: number, properties?: any) {
    this._portalService.logAction('diagnostic-data-metric', name, {
      ...properties,
      'average': average,
      'sampleCount': sampleCount,
      'min': min,
      'max': max
    });
  }

  flush() {
    return;
  }

}
