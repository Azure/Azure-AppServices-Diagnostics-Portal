import { TestBed, inject } from '@angular/core/testing';
import { ClientScriptService } from './client-script.service';

describe('ContentService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClientScriptService]
    });
  });

  it('should be created', inject([ClientScriptService], (service: ClientScriptService) => {
    expect(service).toBeTruthy();
  }));
});
