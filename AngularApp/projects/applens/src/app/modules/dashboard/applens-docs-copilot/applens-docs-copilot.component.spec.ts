import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplensDocsCopilotComponent } from './applens-docs-copilot.component';

describe('ApplensDocsCopilotComponent', () => {
  let component: ApplensDocsCopilotComponent;
  let fixture: ComponentFixture<ApplensDocsCopilotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplensDocsCopilotComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplensDocsCopilotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
