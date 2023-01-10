import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowRootNodeComponent } from './workflow-root-node.component';

describe('WorkflowRootNodeComponent', () => {
  let component: WorkflowRootNodeComponent;
  let fixture: ComponentFixture<WorkflowRootNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowRootNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowRootNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
