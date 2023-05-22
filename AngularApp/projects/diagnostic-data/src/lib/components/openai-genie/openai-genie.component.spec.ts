import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OpenAIGenieComponent } from './openai-genie.component';

describe('OpenAIGenieComponent', () => {
  let component: OpenAIGenieComponent;
  let fixture: ComponentFixture<OpenAIGenieComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenAIGenieComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenAIGenieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
