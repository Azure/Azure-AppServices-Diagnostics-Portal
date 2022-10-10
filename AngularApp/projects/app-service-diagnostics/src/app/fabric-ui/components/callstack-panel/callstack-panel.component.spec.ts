import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CallstackPanelComponent } from './callstack-panel.component';

describe('CallstackPanelComponent', () => {
  let component: CallstackPanelComponent;
  let fixture: ComponentFixture<CallstackPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CallstackPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallstackPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
