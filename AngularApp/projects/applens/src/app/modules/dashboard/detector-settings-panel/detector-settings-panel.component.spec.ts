import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorSettingsPanel } from './detector-settings-panel.component';

describe('DetectorSettingsPanelComponent', () => {
  let component: DetectorSettingsPanel;
  let fixture: ComponentFixture<DetectorSettingsPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetectorSettingsPanel ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorSettingsPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
