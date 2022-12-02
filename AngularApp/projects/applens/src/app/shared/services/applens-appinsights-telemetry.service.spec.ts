import { TestBed } from '@angular/core/testing';

import { ApplensAppinsightsTelemetryService } from './applens-appinsights-telemetry.service';

describe('ApplensAppinsightsTelemetryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ApplensAppinsightsTelemetryService = TestBed.get(
      ApplensAppinsightsTelemetryService
    );
    expect(service).toBeTruthy();
  });
});
