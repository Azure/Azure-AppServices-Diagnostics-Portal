import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TimeSeriesGraphComponent } from './time-series-graph.component';

describe('TimeSeriesGraphComponent', () => {
  let component: TimeSeriesGraphComponent;
  let fixture: ComponentFixture<TimeSeriesGraphComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeSeriesGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSeriesGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
