import { InjectionToken } from '@angular/core';

export interface DiagnosticDataConfig {
  production: boolean;
  isPublic: boolean;
  useKustoForTelemetry?: boolean;
  useAppInsightsForTelemetry?: boolean;
}

export const INTERNAL_PROD_CONFIGURATION: DiagnosticDataConfig = {
  production: true,
  isPublic: false,
  useKustoForTelemetry: true,
  useAppInsightsForTelemetry: true
};

export const INTERNAL_DEV_CONFIGURATION: DiagnosticDataConfig = {
  production: false,
  isPublic: false,
  useKustoForTelemetry: true,
  useAppInsightsForTelemetry: true
};

export const PUBLIC_PROD_CONFIGURATION: DiagnosticDataConfig = {
  production: true,
  isPublic: true,
  useKustoForTelemetry: true,
  useAppInsightsForTelemetry: true
};

export const PUBLIC_DEV_CONFIGURATION: DiagnosticDataConfig = {
  production: false,
  isPublic: true,
  useKustoForTelemetry: true,
  useAppInsightsForTelemetry: true
};

export const DIAGNOSTIC_DATA_CONFIG = new InjectionToken<DiagnosticDataConfig>(
  'app.config'
);
