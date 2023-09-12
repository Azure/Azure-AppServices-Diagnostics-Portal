import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagPortalDocsCopilotComponent } from './diagportal-docs-copilot.component';

describe('DiagPortalDocsCopilotComponent', () => {
  let component: DiagPortalDocsCopilotComponent;
  let fixture: ComponentFixture<DiagPortalDocsCopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DiagPortalDocsCopilotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagPortalDocsCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
