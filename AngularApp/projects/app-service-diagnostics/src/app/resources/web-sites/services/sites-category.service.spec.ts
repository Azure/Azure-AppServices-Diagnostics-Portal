import { TestBed, inject } from '@angular/core/testing';

import { SitesCategoryService } from './sites-category.service';

describe('SitesCategoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SitesCategoryService]
    });
  });

  it('should be created', inject(
    [SitesCategoryService],
    (service: SitesCategoryService) => {
      expect(service).toBeTruthy();
    }
  ));
});
