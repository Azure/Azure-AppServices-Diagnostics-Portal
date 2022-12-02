import { TestBed } from '@angular/core/testing';

import { GenericArmConfigService } from './generic-arm-config.service';

describe('GenericArmConfigService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GenericArmConfigService = TestBed.get(
      GenericArmConfigService
    );
    expect(service).toBeTruthy();
  });
});
