import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabMonitoringComponent } from './tab-monitoring.component';

describe('TabMonitoringComponent', () => {
  let component: TabMonitoringComponent;
  let fixture: ComponentFixture<TabMonitoringComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
