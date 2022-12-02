import { TestBed } from '@angular/core/testing';

import { DevelopNavigationGuardService } from './develop-navigation-guard.service';

describe('DevelopNavigationGuardService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DevelopNavigationGuardService = TestBed.get(
      DevelopNavigationGuardService
    );
    expect(service).toBeTruthy();
  });
});
