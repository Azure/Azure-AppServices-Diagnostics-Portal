import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChangeanalysisOnboardingComponent } from './changeanalysis-onboarding.component';

describe('ChangeanalysisOnboardingComponent', () => {
  let component: ChangeanalysisOnboardingComponent;
  let fixture: ComponentFixture<ChangeanalysisOnboardingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeanalysisOnboardingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeanalysisOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
