import { TestBed, inject } from '@angular/core/testing';

import { LoggingV2Service } from './logging-v2.service';

describe('LoggingV2Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggingV2Service]
    });
  });

  it('should be created', inject(
    [LoggingV2Service],
    (service: LoggingV2Service) => {
      expect(service).toBeTruthy();
    }
  ));
});
