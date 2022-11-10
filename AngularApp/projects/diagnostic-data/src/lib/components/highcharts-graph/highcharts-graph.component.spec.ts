import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HighchartsGraphComponent } from './highcharts-graph.component';

describe('HighchartsGraphComponent', () => {
  let component: HighchartsGraphComponent;
  let fixture: ComponentFixture<HighchartsGraphComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HighchartsGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HighchartsGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
