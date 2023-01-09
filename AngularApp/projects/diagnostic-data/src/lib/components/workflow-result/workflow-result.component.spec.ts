import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowResultComponent } from './workflow-result.component';

describe('WorkflowResultComponent', () => {
  let component: WorkflowResultComponent;
  let fixture: ComponentFixture<WorkflowResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowResultComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
