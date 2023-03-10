import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowAcceptUserinputComponent } from './workflow-accept-userinput.component';

describe('WorkflowAcceptUserinputComponent', () => {
  let component: WorkflowAcceptUserinputComponent;
  let fixture: ComponentFixture<WorkflowAcceptUserinputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkflowAcceptUserinputComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowAcceptUserinputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
