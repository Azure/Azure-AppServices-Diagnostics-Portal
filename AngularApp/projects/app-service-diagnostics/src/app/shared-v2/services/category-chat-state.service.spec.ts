import { TestBed, inject } from '@angular/core/testing';

import { CategoryChatStateService } from './category-chat-state.service';

describe('CategoryChatStateService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoryChatStateService]
    });
  });

  it('should be created', inject(
    [CategoryChatStateService],
    (service: CategoryChatStateService) => {
      expect(service).toBeTruthy();
    }
  ));
});
