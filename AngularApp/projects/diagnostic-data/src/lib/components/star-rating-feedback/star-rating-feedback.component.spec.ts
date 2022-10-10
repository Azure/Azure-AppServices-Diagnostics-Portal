import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StarRatingFeedbackComponent } from './star-rating-feedback.component';

describe('StarRatingFeedbackComponent', () => {
  let component: StarRatingFeedbackComponent;
  let fixture: ComponentFixture<StarRatingFeedbackComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StarRatingFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StarRatingFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
