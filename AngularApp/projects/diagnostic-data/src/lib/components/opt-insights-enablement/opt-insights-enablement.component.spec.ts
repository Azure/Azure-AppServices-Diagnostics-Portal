import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptInsightsEnablementComponent } from './opt-insights-enablement.component';

describe('OptInsightsEnablementComponent', () => {
  let component: OptInsightsEnablementComponent;
  let fixture: ComponentFixture<OptInsightsEnablementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptInsightsEnablementComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptInsightsEnablementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
