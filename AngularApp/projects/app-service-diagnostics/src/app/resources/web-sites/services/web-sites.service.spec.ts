import { TestBed, inject } from '@angular/core/testing';

import { WebSitesService } from './web-sites.service';

describe('WebSitesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebSitesService]
    });
  });

  it('should be created', inject(
    [WebSitesService],
    (service: WebSitesService) => {
      expect(service).toBeTruthy();
    }
  ));
});
