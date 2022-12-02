import { TestBed, inject } from '@angular/core/testing';

import { WebHostingEnvironmentsService } from './web-hosting-environments.service';

describe('WebHostingEnvironmentsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebHostingEnvironmentsService]
    });
  });

  it('should be created', inject(
    [WebHostingEnvironmentsService],
    (service: WebHostingEnvironmentsService) => {
      expect(service).toBeTruthy();
    }
  ));
});
