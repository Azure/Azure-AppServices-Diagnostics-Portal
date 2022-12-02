import { TestBed } from '@angular/core/testing';

import { SubscriptionPropertiesService } from './subscription-properties.service';

describe('SubscriptionPropertiesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SubscriptionPropertiesService = TestBed.get(
      SubscriptionPropertiesService
    );
    expect(service).toBeTruthy();
  });
});
