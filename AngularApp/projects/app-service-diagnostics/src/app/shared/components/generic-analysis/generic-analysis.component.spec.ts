import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GenericAnalysisComponent } from './generic-analysis.component';

describe('GenericAnalysisComponent', () => {
  let component: GenericAnalysisComponent;
  let fixture: ComponentFixture<GenericAnalysisComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GenericAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GenericAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
