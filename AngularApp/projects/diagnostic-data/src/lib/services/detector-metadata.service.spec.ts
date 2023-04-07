import { TestBed } from '@angular/core/testing';

import { DetectorMetadataService } from './detector-metadata.service';

describe('DetectorMetadataService', () => {
  let service: DetectorMetadataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetectorMetadataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
