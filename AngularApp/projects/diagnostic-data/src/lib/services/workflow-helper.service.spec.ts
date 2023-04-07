import { TestBed } from '@angular/core/testing';

import { WorkflowHelperService } from "./workflow-helper.service";

describe('WorkWorkflowService', () => {
  let service: WorkflowHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkflowHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
