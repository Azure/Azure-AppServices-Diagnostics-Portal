import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabAnalyticsDevelopComponent } from './tab-analytics-develop.component';

describe('TabAnalyticsDevelopComponent', () => {
  let component: TabAnalyticsDevelopComponent;
  let fixture: ComponentFixture<TabAnalyticsDevelopComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabAnalyticsDevelopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabAnalyticsDevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
