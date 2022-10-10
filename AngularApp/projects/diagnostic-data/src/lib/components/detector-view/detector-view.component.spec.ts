import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorViewComponent } from './detector-view.component';

describe('DetectorViewComponent', () => {
  let component: DetectorViewComponent;
  let fixture: ComponentFixture<DetectorViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
