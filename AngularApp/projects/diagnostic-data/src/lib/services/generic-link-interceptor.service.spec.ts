import { TestBed } from '@angular/core/testing';

import { GenericLinkInterceptorService } from './generic-link-interceptor.service';

describe('GenericLinkInterceptorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GenericLinkInterceptorService = TestBed.get(GenericLinkInterceptorService);
    expect(service).toBeTruthy();
  });
});
