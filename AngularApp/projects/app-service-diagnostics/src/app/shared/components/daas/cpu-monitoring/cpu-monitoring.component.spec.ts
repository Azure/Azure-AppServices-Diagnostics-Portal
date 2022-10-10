import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CpuMonitoringComponent } from './cpu-monitoring.component';

describe('CpuMonitoringComponent', () => {
  let component: CpuMonitoringComponent;
  let fixture: ComponentFixture<CpuMonitoringComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CpuMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
