import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DiagnosticsSettingsComponent } from './diagnostics-settings.component';

describe('DiagnosticsSettingsComponent', () => {
  let component: DiagnosticsSettingsComponent;
  let fixture: ComponentFixture<DiagnosticsSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DiagnosticsSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticsSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
