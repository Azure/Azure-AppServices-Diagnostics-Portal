import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LinuxPythonCpuProfilerComponent } from './linux-python-cpu-profiler.component';

describe('LinuxPythonCpuProfilerComponent', () => {
  let component: LinuxPythonCpuProfilerComponent;
  let fixture: ComponentFixture<LinuxPythonCpuProfilerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LinuxPythonCpuProfilerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinuxPythonCpuProfilerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
