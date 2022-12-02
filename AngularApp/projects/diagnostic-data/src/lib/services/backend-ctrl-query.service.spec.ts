import { TestBed } from '@angular/core/testing';

import { BackendCtrlQueryService } from './backend-ctrl-query.service';

describe('BackendCtrlQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackendCtrlQueryService = TestBed.get(
      BackendCtrlQueryService
    );
    expect(service).toBeTruthy();
  });
});
