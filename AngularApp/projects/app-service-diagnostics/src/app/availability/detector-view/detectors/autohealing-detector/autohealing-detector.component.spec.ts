import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AutohealingDetectorComponent } from './autohealing-detector.component';

describe('AutohealingDetectorComponent', () => {
  let component: AutohealingDetectorComponent;
  let fixture: ComponentFixture<AutohealingDetectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingDetectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingDetectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
