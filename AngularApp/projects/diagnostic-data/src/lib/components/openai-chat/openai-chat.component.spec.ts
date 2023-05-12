import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OpenAIChatComponent } from './openai-chat.component';

describe('OpenAIChatComponent', () => {
  let component: OpenAIChatComponent;
  let fixture: ComponentFixture<OpenAIChatComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenAIChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenAIChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
