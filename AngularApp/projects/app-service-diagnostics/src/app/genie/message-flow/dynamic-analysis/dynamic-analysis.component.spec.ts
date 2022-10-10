import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DynamicAnalysisComponent } from './dynamic-analysis.component';

describe('DynamicAnalysisComponent', () => {
  let component: DynamicAnalysisComponent;
  let fixture: ComponentFixture<DynamicAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
