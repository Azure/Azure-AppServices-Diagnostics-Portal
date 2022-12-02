import { TestBed, inject } from '@angular/core/testing';

import { SiteFeatureService } from './site-feature.service';

describe('SiteFeatureService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SiteFeatureService]
    });
  });

  it('should be created', inject(
    [SiteFeatureService],
    (service: SiteFeatureService) => {
      expect(service).toBeTruthy();
    }
  ));
});
