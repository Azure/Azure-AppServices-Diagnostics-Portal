import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RiskAlertsPanelomponent } from './risk-alerts-panel.component';

describe('RiskAlertsPanelomponent', () => {
  let component: RiskAlertsPanelomponent;
  let fixture: ComponentFixture<RiskAlertsPanelomponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RiskAlertsPanelomponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RiskAlertsPanelomponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
