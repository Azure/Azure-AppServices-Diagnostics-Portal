import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MarkdownViewComponent } from './markdown-view.component';

describe('MarkdownViewComponent', () => {
  let component: MarkdownViewComponent;
  let fixture: ComponentFixture<MarkdownViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarkdownViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
