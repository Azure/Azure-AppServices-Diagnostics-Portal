import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotificationRenderingComponent } from './notification-rendering.component';

describe('NotificationComponent', () => {
  let component: NotificationRenderingComponent;
  let fixture: ComponentFixture<NotificationRenderingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationRenderingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationRenderingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
