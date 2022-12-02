import { TestBed } from '@angular/core/testing';

import { SharedStorageAccountService } from './shared-storage-account.service';

describe('SharedStorageAccountService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SharedStorageAccountService = TestBed.get(
      SharedStorageAccountService
    );
    expect(service).toBeTruthy();
  });
});
