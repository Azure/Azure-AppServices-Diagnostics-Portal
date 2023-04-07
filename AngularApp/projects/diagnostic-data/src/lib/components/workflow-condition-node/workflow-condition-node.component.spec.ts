import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowConditionNodeComponent } from './workflow-condition-node.component';

describe('WorkflowConditionNodeComponent', () => {
  let component: WorkflowConditionNodeComponent;
  let fixture: ComponentFixture<WorkflowConditionNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowConditionNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowConditionNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
