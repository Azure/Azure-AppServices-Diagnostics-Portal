import { TestBed } from '@angular/core/testing';

import { OptInsightsService } from './optinsights.service';

describe('OptInsightsService', () => {
  let service: OptInsightsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptInsightsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
