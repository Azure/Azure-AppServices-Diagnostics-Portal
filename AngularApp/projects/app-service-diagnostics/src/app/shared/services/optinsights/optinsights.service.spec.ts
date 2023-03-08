import { TestBed } from '@angular/core/testing';

import { OptinsightsService } from './optinsights.service';

describe('OptinsightsService', () => {
  let service: OptinsightsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptinsightsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
