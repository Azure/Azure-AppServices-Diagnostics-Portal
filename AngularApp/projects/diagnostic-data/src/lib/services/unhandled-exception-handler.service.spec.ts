import { TestBed } from '@angular/core/testing';

import { UnhandledExceptionHandlerService } from './unhandled-exception-handler.service';

describe('UnhandledExceptionHandlerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: UnhandledExceptionHandlerService = TestBed.get(
      UnhandledExceptionHandlerService
    );
    expect(service).toBeTruthy();
  });
});
