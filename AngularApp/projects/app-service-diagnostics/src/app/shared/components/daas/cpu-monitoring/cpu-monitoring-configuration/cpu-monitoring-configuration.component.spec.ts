import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CpuMonitoringConfigurationComponent } from './cpu-monitoring-configuration.component';

describe('CpuMonitoringConfigurationComponent', () => {
  let component: CpuMonitoringConfigurationComponent;
  let fixture: ComponentFixture<CpuMonitoringConfigurationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CpuMonitoringConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
