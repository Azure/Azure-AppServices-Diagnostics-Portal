import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagChatSolutionComponent } from './diag-chat-solution.component';

describe('DiagChatSolutionComponent', () => {
  let component: DiagChatSolutionComponent;
  let fixture: ComponentFixture<DiagChatSolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiagChatSolutionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagChatSolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
