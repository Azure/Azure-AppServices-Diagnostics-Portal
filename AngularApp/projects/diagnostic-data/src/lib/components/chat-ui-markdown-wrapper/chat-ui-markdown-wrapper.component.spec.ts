import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ChatUIMarkdownWrapperComponent } from './chat-ui-markdown-wrapper.component';

describe('ChatUIMarkdownWrapperComponent', () => {
  let component: ChatUIMarkdownWrapperComponent;
  let fixture: ComponentFixture<ChatUIMarkdownWrapperComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChatUIMarkdownWrapperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatUIMarkdownWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
