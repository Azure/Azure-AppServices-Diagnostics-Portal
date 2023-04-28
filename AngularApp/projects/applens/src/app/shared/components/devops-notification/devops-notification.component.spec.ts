import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevopsNotificationComponent } from './devops-notification.component';

describe('DevopsNotificationComponent', () => {
  let component: DevopsNotificationComponent;
  let fixture: ComponentFixture<DevopsNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevopsNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DevopsNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
