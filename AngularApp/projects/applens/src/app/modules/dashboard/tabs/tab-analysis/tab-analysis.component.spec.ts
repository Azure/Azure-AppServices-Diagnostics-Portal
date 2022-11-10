import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabAnalysisComponent } from './tab-analysis.component';

describe('TabAnalysisComponent', () => {
  let component: TabAnalysisComponent;
  let fixture: ComponentFixture<TabAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
