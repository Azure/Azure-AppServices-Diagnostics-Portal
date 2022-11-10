import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CopyInsightDetailsComponent } from './copy-insight-details.component';

describe('CopyInsightDetailsComponent', () => {
  let component: CopyInsightDetailsComponent;
  let fixture: ComponentFixture<CopyInsightDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyInsightDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyInsightDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
