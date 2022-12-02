import { TestBed, inject } from '@angular/core/testing';

import { ApplensCommsService } from './applens-comms.service';

describe('ApplensCommsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApplensCommsService]
    });
  });

  it('should be created', inject(
    [ApplensCommsService],
    (service: ApplensCommsService) => {
      expect(service).toBeTruthy();
    }
  ));
});
