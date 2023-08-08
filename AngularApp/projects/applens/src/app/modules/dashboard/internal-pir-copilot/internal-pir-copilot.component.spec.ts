import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalPirCopilotComponent } from './internal-pir-copilot.component';

describe('InternalPirCopilotComponent', () => {
  let component: InternalPirCopilotComponent;
  let fixture: ComponentFixture<InternalPirCopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InternalPirCopilotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InternalPirCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
