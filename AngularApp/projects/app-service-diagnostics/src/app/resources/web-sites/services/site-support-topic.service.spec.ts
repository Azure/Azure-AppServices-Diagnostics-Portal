import { TestBed, inject } from '@angular/core/testing';

import { SiteSupportTopicService } from './site-support-topic.service';

describe('SiteSupportTopicService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SiteSupportTopicService]
    });
  });

  it('should be created', inject(
    [SiteSupportTopicService],
    (service: SiteSupportTopicService) => {
      expect(service).toBeTruthy();
    }
  ));
});
