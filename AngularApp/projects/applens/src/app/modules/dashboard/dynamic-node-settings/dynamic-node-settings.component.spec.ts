import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicNodeSettings } from './dynamic-node-settings.component';

describe('DynamicNodeSettingsComponent', () => {
  let component: DynamicNodeSettings;
  let fixture: ComponentFixture<DynamicNodeSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DynamicNodeSettings ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicNodeSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
