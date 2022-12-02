import { TestBed, inject } from '@angular/core/testing';

import { AseCategoryService } from './ase-category.service';

describe('AseCategoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AseCategoryService]
    });
  });

  it('should be created', inject(
    [AseCategoryService],
    (service: AseCategoryService) => {
      expect(service).toBeTruthy();
    }
  ));
});
