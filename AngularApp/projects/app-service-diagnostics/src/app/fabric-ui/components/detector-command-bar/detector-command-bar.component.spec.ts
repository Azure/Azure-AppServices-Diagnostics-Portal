import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorCommandBarComponent } from './detector-command-bar.component';

describe('DetectorCommandBarComponent', () => {
  let component: DetectorCommandBarComponent;
  let fixture: ComponentFixture<DetectorCommandBarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorCommandBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorCommandBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
