import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownRenderingSettingsComponent } from './markdown-rendering-settings.component';

describe('MarkdownRenderingSettingsComponent', () => {
  let component: MarkdownRenderingSettingsComponent;
  let fixture: ComponentFixture<MarkdownRenderingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarkdownRenderingSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarkdownRenderingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
