import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ApplensOpenAIChatComponent } from './applens-openai-chat.component';

describe('ApplensOpenAIChatComponent', () => {
  let component: ApplensOpenAIChatComponent;
  let fixture: ComponentFixture<ApplensOpenAIChatComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplensOpenAIChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplensOpenAIChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
