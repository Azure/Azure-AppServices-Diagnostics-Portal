import { TestBed } from '@angular/core/testing';

import { LinkInterceptorService } from './link-interceptor.service';

describe('LinkInterceptorService', () => {
  let service: LinkInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinkInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
