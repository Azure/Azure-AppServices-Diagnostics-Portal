import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorListAnalysisComponent } from './detector-list-analysis.component';

describe('DetectorListAnalysisComponent', () => {
  let component: DetectorListAnalysisComponent;
  let fixture: ComponentFixture<DetectorListAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorListAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorListAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
