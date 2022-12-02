import { TestBed, inject } from '@angular/core/testing';

import { SupportTopicService } from './support-topic.service';

describe('SupportTopicService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupportTopicService]
    });
  });

  it('should be created', inject(
    [SupportTopicService],
    (service: SupportTopicService) => {
      expect(service).toBeTruthy();
    }
  ));
});
