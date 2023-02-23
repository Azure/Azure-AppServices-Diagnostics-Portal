import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightRenderingSettingsComponent } from './insight-rendering-settings.component';

describe('InsightRenderingSettingsComponent', () => {
  let component: InsightRenderingSettingsComponent;
  let fixture: ComponentFixture<InsightRenderingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InsightRenderingSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InsightRenderingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
