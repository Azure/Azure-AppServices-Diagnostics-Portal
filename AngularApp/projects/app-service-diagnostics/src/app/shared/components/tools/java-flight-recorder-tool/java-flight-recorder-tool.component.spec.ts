import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JavaFlightRecorderToolComponent } from './java-flight-recorder-tool.component';

describe('JavaFlightRecorderToolComponent', () => {
  let component: JavaFlightRecorderToolComponent;
  let fixture: ComponentFixture<JavaFlightRecorderToolComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JavaFlightRecorderToolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JavaFlightRecorderToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
