import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchCaseStepComponent } from './switch-case-step.component';

describe('SwitchCaseStepComponent', () => {
  let component: SwitchCaseStepComponent;
  let fixture: ComponentFixture<SwitchCaseStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwitchCaseStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchCaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
