import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionIftrueStepComponent } from './condition-iftrue-step.component';

describe('ConditionIftrueStepComponent', () => {
  let component: ConditionIftrueStepComponent;
  let fixture: ComponentFixture<ConditionIftrueStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConditionIftrueStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionIftrueStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
