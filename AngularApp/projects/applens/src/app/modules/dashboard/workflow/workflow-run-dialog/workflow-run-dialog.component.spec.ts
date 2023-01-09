import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowRunDialogComponent } from './workflow-run-dialog.component';

describe('WorkflowRunDialogComponent', () => {
  let component: WorkflowRunDialogComponent;
  let fixture: ComponentFixture<WorkflowRunDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowRunDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowRunDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
