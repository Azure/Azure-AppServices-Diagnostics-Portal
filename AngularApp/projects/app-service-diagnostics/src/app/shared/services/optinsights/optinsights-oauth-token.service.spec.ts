import { TestBed } from '@angular/core/testing';

import { OptinsightsOauthTokenService } from './optinsights-oauth-token.service';

describe('OptinsightsOauthTokenService', () => {
  let service: OptinsightsOauthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptinsightsOauthTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
