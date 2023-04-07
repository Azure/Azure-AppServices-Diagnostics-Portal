import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionIffalseStepComponent } from './condition-iffalse-step.component';

describe('ConditionIffalseStepComponent', () => {
  let component: ConditionIffalseStepComponent;
  let fixture: ComponentFixture<ConditionIffalseStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConditionIffalseStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionIffalseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
