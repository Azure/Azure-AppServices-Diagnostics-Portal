import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorControlComponent } from './detector-control.component';

describe('DetectorControlComponent', () => {
  let component: DetectorControlComponent;
  let fixture: ComponentFixture<DetectorControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
