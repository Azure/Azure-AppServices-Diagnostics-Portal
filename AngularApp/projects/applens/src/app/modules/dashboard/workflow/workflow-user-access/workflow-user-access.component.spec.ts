import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowUserAccessComponent } from './workflow-user-access.component';

describe('WorkflowUserAccessComponent', () => {
  let component: WorkflowUserAccessComponent;
  let fixture: ComponentFixture<WorkflowUserAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowUserAccessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowUserAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
