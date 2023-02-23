import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorSettingsPanelComponent } from './detector-settings-panel.component';

describe('DetectorSettingsPanelComponent', () => {
  let component: DetectorSettingsPanelComponent;
  let fixture: ComponentFixture<DetectorSettingsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetectorSettingsPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorSettingsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
