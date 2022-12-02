import { TestBed, inject } from '@angular/core/testing';

import { ObserverService } from './observer.service';

describe('ObserverService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ObserverService]
    });
  });

  it('should be created', inject(
    [ObserverService],
    (service: ObserverService) => {
      expect(service).toBeTruthy();
    }
  ));
});
