import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttChartTaskbarColorsComponent } from './gantt-chart-taskbar-colors.component';

describe('GanttChartTaskbarColorsComponent', () => {
  let component: GanttChartTaskbarColorsComponent;
  let fixture: ComponentFixture<GanttChartTaskbarColorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GanttChartTaskbarColorsComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GanttChartTaskbarColorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
