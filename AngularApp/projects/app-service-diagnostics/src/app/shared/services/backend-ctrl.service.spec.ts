import { TestBed, inject } from '@angular/core/testing';

import { BackendCtrlService } from './backend-ctrl.service';

describe('BackendCtrlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BackendCtrlService]
    });
  });

  it('should be created', inject(
    [BackendCtrlService],
    (service: BackendCtrlService) => {
      expect(service).toBeTruthy();
    }
  ));
});
