import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CrashMonitoringComponent } from './crash-monitoring.component';

describe('CrashMonitoringComponent', () => {
  let component: CrashMonitoringComponent;
  let fixture: ComponentFixture<CrashMonitoringComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CrashMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrashMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
