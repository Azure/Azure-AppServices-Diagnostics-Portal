import { TestBed } from '@angular/core/testing';

import { DiagnosticApiAppSettingsService } from './diagnostic-api-app-settings.service';

describe('DiagnosticApiAppSettingsService', () => {
  let service: DiagnosticApiAppSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnosticApiAppSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
