import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IfElseConditionStepComponent } from './ifelse-condition-step.component';

describe('IfElseConditionStepComponent', () => {
  let component: IfElseConditionStepComponent;
  let fixture: ComponentFixture<IfElseConditionStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IfElseConditionStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IfElseConditionStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
