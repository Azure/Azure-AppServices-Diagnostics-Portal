import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TakeSurveyComponent } from './takesurvey.component';

describe('TakeSurveyComponent', () => {
  let component: TakeSurveyComponent;
  let fixture: ComponentFixture<TakeSurveyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TakeSurveyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TakeSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
