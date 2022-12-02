import { InjectionToken } from '@angular/core';

export interface DiagEnvironment {
  isProduction: boolean;
}

export const PROD_ENV: DiagEnvironment = {
  isProduction: true
};

export const DIAGNOSTIC_DATA_ENV = new InjectionToken<DiagEnvironment>(
  'DIAG_DATA_ENV'
);
