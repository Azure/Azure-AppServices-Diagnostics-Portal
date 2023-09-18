import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationCopilotComponent } from './documentation-copilot.component';

describe('DocumentationCopilotComponent', () => {
  let component: DocumentationCopilotComponent;
  let fixture: ComponentFixture<DocumentationCopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DocumentationCopilotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentationCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
