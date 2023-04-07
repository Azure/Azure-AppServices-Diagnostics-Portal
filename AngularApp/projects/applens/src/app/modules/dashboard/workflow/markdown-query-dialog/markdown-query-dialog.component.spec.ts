import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownQueryDialogComponent } from './markdown-query-dialog.component';

describe('MarkdownQueryDialogComponent', () => {
  let component: MarkdownQueryDialogComponent;
  let fixture: ComponentFixture<MarkdownQueryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkdownQueryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownQueryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
