import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowNodeComponent } from './workflow-node.component';

describe('WorkflowNodeComponent', () => {
  let component: WorkflowNodeComponent;
  let fixture: ComponentFixture<WorkflowNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
