import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AppInsightsEnablementComponent } from './app-insights-enablement.component';

describe('AppInsightsEnablementComponent', () => {
  let component: AppInsightsEnablementComponent;
  let fixture: ComponentFixture<AppInsightsEnablementComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AppInsightsEnablementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppInsightsEnablementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
