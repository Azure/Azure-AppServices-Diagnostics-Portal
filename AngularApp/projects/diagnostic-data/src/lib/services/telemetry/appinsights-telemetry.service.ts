import { Injectable } from '@angular/core';
import { ITelemetryProvider } from './telemetry.common';

@Injectable()
export class AppInsightsTelemetryService implements ITelemetryProvider {
  constructor() {}

  logEvent(message?: string, properties?: any, measurements?: any) {}

  logException(
    exception: Error,
    handledAt?: string,
    properties?: any,
    severityLevel?: any
  ) {}

  logPageView(
    name: string,
    url: string,
    properties?: any,
    measurements?: any,
    duration?: number
  ) {}

  logTrace(message: string, properties?: any, severityLevel?: any) {}

  logMetric(
    name: string,
    average: number,
    sampleCount: number,
    min: number,
    max: number,
    properties?: any
  ) {}

  flush() {}
}
