import { TestBed, inject } from '@angular/core/testing';

import { CustomUrlSerializerService } from './custom-url-serializer.service';

describe('CustomUrlSerializerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomUrlSerializerService]
    });
  });

  it('should be created', inject(
    [CustomUrlSerializerService],
    (service: CustomUrlSerializerService) => {
      expect(service).toBeTruthy();
    }
  ));
});
