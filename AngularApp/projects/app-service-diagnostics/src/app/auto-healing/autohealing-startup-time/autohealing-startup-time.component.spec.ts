import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AutohealingStartupTimeComponent } from './autohealing-startup-time.component';

describe('AutohealingStartupTimeComponent', () => {
  let component: AutohealingStartupTimeComponent;
  let fixture: ComponentFixture<AutohealingStartupTimeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingStartupTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingStartupTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
