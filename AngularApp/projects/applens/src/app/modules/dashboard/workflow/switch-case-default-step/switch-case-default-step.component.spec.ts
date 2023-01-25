import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchCaseDefaultStepComponent } from './switch-case-default-step.component';

describe('SwitchCaseDefaultStepComponent', () => {
  let component: SwitchCaseDefaultStepComponent;
  let fixture: ComponentFixture<SwitchCaseDefaultStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwitchCaseDefaultStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchCaseDefaultStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
