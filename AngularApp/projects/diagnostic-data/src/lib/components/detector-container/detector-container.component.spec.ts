import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorContainerComponent } from './detector-container.component';

describe('DetectorContainerComponent', () => {
  let component: DetectorContainerComponent;
  let fixture: ComponentFixture<DetectorContainerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
