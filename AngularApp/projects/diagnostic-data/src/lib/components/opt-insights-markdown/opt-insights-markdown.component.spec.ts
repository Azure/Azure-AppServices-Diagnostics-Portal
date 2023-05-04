import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptInsightsMarkdownComponent } from './opt-insights-markdown.component';

describe('OptInsightsMarkdownComponent', () => {
  let component: OptInsightsMarkdownComponent;
  let fixture: ComponentFixture<OptInsightsMarkdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptInsightsMarkdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OptInsightsMarkdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
