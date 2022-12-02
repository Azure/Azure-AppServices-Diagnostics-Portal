import { TestBed, inject } from '@angular/core/testing';

import { CaseCleansingApiService } from './casecleansing-api.service';

describe('CaseCleansingApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CaseCleansingApiService]
    });
  });

  it('should be created', inject(
    [CaseCleansingApiService],
    (service: CaseCleansingApiService) => {
      expect(service).toBeTruthy();
    }
  ));
});
