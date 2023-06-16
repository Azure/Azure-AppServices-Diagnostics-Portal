import { TestBed } from '@angular/core/testing';

import { SiteLinkInspectorService } from './site-link-inspector.service';

describe('SiteLinkInspectorService', () => {
  let service: SiteLinkInspectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SiteLinkInspectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
