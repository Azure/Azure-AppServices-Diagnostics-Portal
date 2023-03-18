import { TestBed } from '@angular/core/testing';

import { OptInsightsOAuthTokenService } from './optinsights-oauth-token.service';

describe('OptinsightsOauthTokenService', () => {
  let service: OptInsightsOAuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OptInsightsOAuthTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
