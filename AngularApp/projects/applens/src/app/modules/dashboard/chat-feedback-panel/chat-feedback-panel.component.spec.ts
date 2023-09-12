import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatFeedbackPanelComponent } from './chat-feedback-panel.component';

describe('KustoGPTComponent', () => {
  let component: ChatFeedbackPanelComponent;
  let fixture: ComponentFixture<ChatFeedbackPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatFeedbackPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatFeedbackPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
