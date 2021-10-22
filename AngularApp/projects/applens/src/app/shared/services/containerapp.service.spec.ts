import { TestBed, inject } from '@angular/core/testing';

import { ContainerAppService } from './containerapp.service';

describe('ContainerAppService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ContainerAppService]
    });
  });

  it('should be created', inject([ContainerAppService], (service: ContainerAppService) => {
    expect(service).toBeTruthy();
  }));
});
