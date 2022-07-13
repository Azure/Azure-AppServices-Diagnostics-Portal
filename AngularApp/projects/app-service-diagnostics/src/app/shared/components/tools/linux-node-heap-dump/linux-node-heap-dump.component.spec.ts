import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinuxNodeHeapDumpComponent } from './linux-node-heap-dump.component';

describe('LinuxNodeHeapDumpComponent', () => {
  let component: LinuxNodeHeapDumpComponent;
  let fixture: ComponentFixture<LinuxNodeHeapDumpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinuxNodeHeapDumpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinuxNodeHeapDumpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
