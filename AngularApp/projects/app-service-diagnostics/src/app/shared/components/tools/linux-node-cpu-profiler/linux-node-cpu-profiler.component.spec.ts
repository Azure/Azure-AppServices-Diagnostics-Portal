import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LinuxNodeCpuProfilerComponent } from './linux-node-cpu-profiler.component';

describe('LinuxNodeCpuProfilerComponent', () => {
  let component: LinuxNodeCpuProfilerComponent;
  let fixture: ComponentFixture<LinuxNodeCpuProfilerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LinuxNodeCpuProfilerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinuxNodeCpuProfilerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
