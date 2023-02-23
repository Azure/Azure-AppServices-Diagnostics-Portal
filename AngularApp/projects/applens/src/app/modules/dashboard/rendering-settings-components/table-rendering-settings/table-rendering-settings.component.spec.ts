import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableRenderingSettingsComponent } from './table-rendering-settings.component';

describe('TableRenderingSettingsComponent', () => {
  let component: TableRenderingSettingsComponent;
  let fixture: ComponentFixture<TableRenderingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableRenderingSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableRenderingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
