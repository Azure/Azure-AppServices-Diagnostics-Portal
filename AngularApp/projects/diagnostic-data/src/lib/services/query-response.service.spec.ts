import { TestBed } from '@angular/core/testing';
import { QueryResponseService } from './query-response.service';


describe('QueryResponseService', () => {
  let service: QueryResponseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryResponseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
