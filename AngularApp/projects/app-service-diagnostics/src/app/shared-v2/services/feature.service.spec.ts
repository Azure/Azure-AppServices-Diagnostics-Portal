import { TestBed, inject } from '@angular/core/testing';

import { FeatureService } from './feature.service';

describe('FeatureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureService]
    });
  });

  it('should be created', inject(
    [FeatureService],
    (service: FeatureService) => {
      expect(service).toBeTruthy();
    }
  ));
});
