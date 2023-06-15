import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DetectorCopilotComponent } from './detector-copilot.component';

describe('DetectorCopilotComponent', () => {
  let component: DetectorCopilotComponent;
  let fixture: ComponentFixture<DetectorCopilotComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorCopilotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
