import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagChatContainerComponent } from './diag-chat-container.component';

describe('DiagChatContainerComponent', () => {
  let component: DiagChatContainerComponent;
  let fixture: ComponentFixture<DiagChatContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiagChatContainerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagChatContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
