import { TestBed } from '@angular/core/testing';

import { AseLinkInterceptorService } from './ase-link-interceptor.service';

describe('AseLinkInterceptorService', () => {
  let service: AseLinkInterceptorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AseLinkInterceptorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
