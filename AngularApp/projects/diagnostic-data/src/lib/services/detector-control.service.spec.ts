import { TestBed, inject } from '@angular/core/testing';

import { DetectorControlService } from './detector-control.service';

describe('DetectorControlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DetectorControlService]
    });
  });

  it('should be created', inject(
    [DetectorControlService],
    (service: DetectorControlService) => {
      expect(service).toBeTruthy();
    }
  ));
});
