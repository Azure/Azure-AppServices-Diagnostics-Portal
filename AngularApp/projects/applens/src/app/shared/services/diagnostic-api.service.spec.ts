import { TestBed, inject } from '@angular/core/testing';

import { DiagnosticApiService } from './diagnostic-api.service';

describe('DiagnosticApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DiagnosticApiService]
    });
  });

  it('should be created', inject(
    [DiagnosticApiService],
    (service: DiagnosticApiService) => {
      expect(service).toBeTruthy();
    }
  ));
});
