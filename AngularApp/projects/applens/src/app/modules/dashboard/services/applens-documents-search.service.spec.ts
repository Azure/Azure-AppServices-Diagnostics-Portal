import { TestBed } from '@angular/core/testing';

import { ApplensDocumentsSearchService } from './applens-documents-search.service';

describe('ApplensDocumentsSearchService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ApplensDocumentsSearchService = TestBed.get(
      ApplensDocumentsSearchService
    );
    expect(service).toBeTruthy();
  });
});
