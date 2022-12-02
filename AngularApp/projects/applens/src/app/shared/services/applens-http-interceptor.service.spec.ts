import { TestBed, inject } from '@angular/core/testing';

import { AppLensInterceptorService } from './applens-http-interceptor.service';

describe('AppLensInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppLensInterceptorService]
    });
  });

  it('should be created', inject(
    [AppLensInterceptorService],
    (service: AppLensInterceptorService) => {
      expect(service).toBeTruthy();
    }
  ));
});
