import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DiagosticSessionsPanelComponent } from './diagostic-sessions-panel.component';

describe('DiagosticSessionsPanelComponent', () => {
  let component: DiagosticSessionsPanelComponent;
  let fixture: ComponentFixture<DiagosticSessionsPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DiagosticSessionsPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagosticSessionsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
