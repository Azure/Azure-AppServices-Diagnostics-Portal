import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CxpChatLauncherComponent } from './cxp-chat-launcher.component';

describe('CxpChatLauncherComponent', () => {
  let component: CxpChatLauncherComponent;
  let fixture: ComponentFixture<CxpChatLauncherComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CxpChatLauncherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CxpChatLauncherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
