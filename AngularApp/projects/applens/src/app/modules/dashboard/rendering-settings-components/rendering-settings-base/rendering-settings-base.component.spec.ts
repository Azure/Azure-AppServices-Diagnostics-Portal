import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenderingSettingsBaseComponent } from './rendering-settings-base.component';

describe('RenderingSettingsBaseComponent', () => {
  let component: RenderingSettingsBaseComponent;
  let fixture: ComponentFixture<RenderingSettingsBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RenderingSettingsBaseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RenderingSettingsBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
