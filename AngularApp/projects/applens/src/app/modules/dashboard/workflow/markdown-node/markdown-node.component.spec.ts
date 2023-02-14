import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownNodeComponent } from './markdown-node.component';

describe('MarkdownNodeComponent', () => {
  let component: MarkdownNodeComponent;
  let fixture: ComponentFixture<MarkdownNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkdownNodeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
