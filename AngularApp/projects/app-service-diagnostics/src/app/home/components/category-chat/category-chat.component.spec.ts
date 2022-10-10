import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryChatComponent } from './category-chat.component';

describe('CategoryChatComponent', () => {
  let component: CategoryChatComponent;
  let fixture: ComponentFixture<CategoryChatComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
