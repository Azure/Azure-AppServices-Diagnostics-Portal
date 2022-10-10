import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CpuMonitoringActivityComponent } from './cpu-monitoring-activity.component';

describe('CpuMonitoringActivityComponent', () => {
  let component: CpuMonitoringActivityComponent;
  let fixture: ComponentFixture<CpuMonitoringActivityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CpuMonitoringActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
