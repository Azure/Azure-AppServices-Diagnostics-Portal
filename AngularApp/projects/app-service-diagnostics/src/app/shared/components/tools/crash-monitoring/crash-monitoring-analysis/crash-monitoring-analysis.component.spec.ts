import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CrashMonitoringAnalysisComponent } from './crash-monitoring-analysis.component';

describe('CrashMonitoringAnalysisComponent', () => {
  let component: CrashMonitoringAnalysisComponent;
  let fixture: ComponentFixture<CrashMonitoringAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CrashMonitoringAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrashMonitoringAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
