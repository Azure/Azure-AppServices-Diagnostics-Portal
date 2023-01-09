import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchStepComponent } from './switch-step.component';

describe('SwitchStepComponent', () => {
  let component: SwitchStepComponent;
  let fixture: ComponentFixture<SwitchStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwitchStepComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
