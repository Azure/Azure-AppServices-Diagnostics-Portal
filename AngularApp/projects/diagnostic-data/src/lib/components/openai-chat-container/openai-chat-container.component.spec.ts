import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OpenAIChatContainerComponent } from './openai-chat-container.component';

describe('OpenAIChatContainerComponent', () => {
  let component: OpenAIChatContainerComponent;
  let fixture: ComponentFixture<OpenAIChatContainerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenAIChatContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenAIChatContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
