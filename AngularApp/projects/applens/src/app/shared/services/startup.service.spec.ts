import { TestBed, inject } from '@angular/core/testing';

import { StartupService } from './startup.service';

describe('StartupService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StartupService]
    });
  });

  it('should be created', inject(
    [StartupService],
    (service: StartupService) => {
      expect(service).toBeTruthy();
    }
  ));
});
